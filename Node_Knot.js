/*Hello and thanks for taking a look at the source code for Node Knot!
You can play this game right now at dthomas.io
This code is broken into 16 sections. The sections are as follows:
1)  Setup and Global Declarations
2)  Main Loop
3)  Drawing Functions
4)  Timing Functions
5)  Startup Functions
6)  Puzzle Loading Functions
7)  Lines Object Definition and Functions
8)  Endpoint Detection and Highlighting Functions
9)  Endpoint Move Functions
10) Interior Fill Functions
11) Line Intersection Detection Functions
12) Mouse and Touch Event Listeners and Functions
13) Scoring and Ranking Functions
14) Button Click Handlers
15) Database Communication Functions
16) Utility Functions (Normally not in use)
*/

/*------------------------------
1) Setup and Global Declarations
--------------------------------*/

//Colors - taken from an adobe palette.
var Color1 = "#324759"; //Background
var Color2 = "#BF8B4B"; //Lines
var Color3 = "rgba(139, 173, 218, 0.5)"; //Endpoints
var Color4 = "#BF8B4B"; //Fill
var Color5 = "#5D768C"; //Ribbon
var Color6 = "#4AF626"; //Console Green

//create canvas object:
var canvas = document.querySelector("canvas");
var c = canvas.getContext("2d");

//Size and style the canvas.
c.canvas.width = 300;
c.canvas.height = 270;
canvas.style.background = Color1;
document.getElementById("topbar").style.backgroundColor = Color5;

//Create and populate an array containing the pixel data from the canvas.
var ImageData = c.getImageData(0, 0, 100, 100);
var Data = ImageData.data;

//Define globals.
var FilledIn = false;
var Dragging = false;
var FirstDown = true;
var FirstPuzzle = false;
var SecondPuzzle = true;
var ElementID = 0;
var MouseState = "moving";
var PreviewStartx = 0;
var PreviewStarty = 0;
var InputFreeze = false;
var WelcomeClosed = false;
var LineArray = [];
var RectArray = [];
var NodesArray = [];
var LinesToMove = [];
var freshPuzzle = [];
var DragPoints = [
  [null, null],
  [null, null],
];
var Dist = 0;
var Time = 0;
var Initials = "";
var StartTime = null;
var ClockInterval = null;
var ResultsDisplayed = false;
var CurrentPuzzle = 0;
var CurrentID = 1;
var Mode = "none";
var PuzzleArray = [
  '[{"endx":16,"endy":114,"startx":215,"starty":8},{"endx":273,"endy":219,"startx":16,"starty":114},{"endx":284,"endy":137,"startx":273,"starty":219},{"endx":22,"endy":214,"startx":284,"starty":137},{"endx":215,"endy":8,"startx":22,"starty":214}]',
  '[{"endx":76,"endy":67,"startx":21,"starty":88},{"endx":105,"endy":70,"startx":76,"starty":67},{"endx":254,"endy":96,"startx":105,"starty":70},{"endx":250,"endy":128,"startx":254,"starty":96},{"endx":239,"endy":220,"startx":250,"starty":128},{"endx":112,"endy":241,"startx":239,"starty":220},{"endx":71,"endy":177,"startx":112,"starty":241},{"endx":39,"endy":210,"startx":71,"starty":177},{"endx":24,"endy":190,"startx":39,"starty":210},{"endx":40,"endy":110,"startx":24,"starty":190},{"endx":21,"endy":88,"startx":40,"starty":110},{"endx":101,"endy":210,"startx":80,"starty":112},{"endx":250,"endy":258,"startx":101,"starty":210},{"endx":280,"endy":164,"startx":250,"starty":258},{"endx":223,"endy":73,"startx":280,"starty":164},{"endx":168,"endy":67,"startx":223,"starty":73},{"endx":116,"endy":90,"startx":168,"starty":67},{"endx":182,"endy":173,"startx":116,"starty":90},{"endx":80,"endy":112,"startx":182,"starty":173}]',
];
var top3Fastest = [];
var top3Shortest = [];
var top3Fastest1 = [];
var top3Shortest1 = [];
var top3Fastest2 = [];
var top3Shortest2 = [];

var Mouse = {
  x: undefined,
  y: undefined,
};

//Call function that sets up welcome screen.
start();

/*----------
2) Main Loop
------------*/

function mainLoop() {
  //If the mouse is not in the canvas, InputFreeze is set to false to prevent out of bounds action.
  mouseInCanvas();

  //If the shape is closed, fill it in.
  if (closed() == true && Dragging == false) {
    if (FilledIn == false) {
      fromRectsToPxs();
      FilledIn = true;
    }
  }

  //If not, clear the fill.
  else {
    FilledIn = false;
    c.clearRect(0, 0, innerWidth, innerHeight);
    ImageData = c.getImageData(0, 0, canvas.width, canvas.height);
    Data = ImageData.data;
  }

  //Clear the screen and paint everything again.
  redraw();

  //If the mouse is inbounds and no dialogue is displayed:
  if (
    InputFreeze == false &&
    ResultsDisplayed == false &&
    WelcomeClosed == true
  ) {
    //Based on the mode, either run the 'play' main loop or the 'create' main loop.
    if (Mode == "play") {
      switch (MouseState) {
        case "moving":
          //Just highlight endpoints.
          isOnEndpoint();
          break;
        case "down":
          //Start counting time from the first mousedown event.
          if (FirstDown == true) {
            startTimer();
            FirstDown = false;
          }
          //Store an array of lines connected to the endpoint that has been selected.
          LinesToMove = getEPs(isOnEndpoint());
          break;
        case "dragging":
          if (Dragging == true) {
            //Store the last point and the current point in an array.
            //The drag points array is how the distance is calculated.
            //The difference between the start and end is taken and added
            //to a running sum.
            DragPoints[0] = DragPoints[1];
            DragPoints[1] = [Mouse.x, Mouse.y];
            if (DragPoints[0] != null) {
              moveEPs(LinesToMove, DragPoints[0][0], DragPoints[0][1]);
            }
          } else {
            //Just highlight endpoints.
            isOnEndpoint();
          }
          break;
        case "up":
          //If intersections are discovered between any two lines, keep the fill color as is.
          if (intersections() == true) {
            Color4 = "#BF8B4B";
            Color2 = "#BF8B4B";
          }
          //If not, stop the clock and put up the score popup. Change the fill to green.
          else {
            Color2 = Color6;
            Color4 = Color6;
            success();
          }
          Dragging = false;
          break;
      }
    }

    //This is the loop that is run in create mode. Allows the user to draw a shape and submit.
    if (Mode == "create") {
      //If the instruction is shown and the user has drawn more than 3 lines, hide the instruction:
      if (
        document.getElementById("createinstruction1").style.visibility ==
        "visible"
      ) {
        if (LineArray.length > 2) {
          document.getElementById("createinstruction1").style.visibility =
            "hidden";
        }
      }
      switch (MouseState) {
        case "moving":
          //Just highlight endpoints.
          isOnEndpoint();
          break;
        case "down":
          //If the user is not dragging a connected endpoint, start a new preview line.
          LinesToMove = getEPs(isOnEndpoint());
          if (Dragging == false) {
            linePreviewStart();
          }
          break;
        case "dragging":
          //Drag an endpoint if an endpoint is selected. Technically don't need the DragPoints data here, but
          //it's left in to simplify the moveEPs function.
          if (Dragging == true) {
            DragPoints[0] = DragPoints[1];
            DragPoints[1] = [Mouse.x, Mouse.y];
            if (DragPoints[0] != null) {
              moveEPs(LinesToMove, DragPoints[0][0], DragPoints[0][1]);
            }
          } else {
            //Drag a line and highlight endpoints.
            linePreviewDrag();
            isOnEndpoint();
          }
          break;
        case "up":
          //Add a new line to the line array.
          if (Dragging == false) {
            createNewLine();
          }
          Dragging = false;
          break;
      }
    }
  }
}

/*------------------
3) Drawing Functions
--------------------*/

//Clears the screen and draws everything again.
function redraw() {
  //clear it.
  c.clearRect(0, 0, window.innerWidth, window.innerHeight);
  c.putImageData(ImageData, 0, 0);

  //draw all of the lines.
  for (var i = 0; i < LineArray.length; i++) {
    l = LineArray[i];
    l.drawline(Color2);
  }

  //draw all of the nodes.
  for (var i = 0; i < NodesArray.length; i++) {
    n = NodesArray[i];
    c.beginPath();
    c.arc(n[0], n[1], 2, Math.PI * 2, false);
    c.fillStyle = Color6;
    c.fill();
  }

  //For some reason, the last node to be drawn causes issues when a fill is performed.
  //draw one off screen so that the issue doesn't occur on a visible node.
  c.beginPath();
  c.arc(-5, -5, 2, Math.PI * 2, false);
  c.fillStyle = Color6;
  c.fill();

  //If the first puzzle is active, draw the arrow showing the user what to do.
  if (FirstPuzzle == true) {
    drawHint();
  }
}

//A function that draws an arrow showing the user what to do on the first puzzle.
function drawHint() {
  //Draw the circle around the node that needs to be moved.
  c.beginPath();
  c.arc(22, 214, 10, Math.PI * 2, false);
  c.strokeStyle = Color6;
  c.stroke();

  //Prepare to draw a dashed line.
  c.setLineDash([3, 3]);

  //Draw a line from the node to the right.
  c.beginPath();
  c.moveTo(30, 210);
  c.lineTo(135, 148);
  c.stroke();

  //Make future lines solid.
  c.setLineDash([]);

  //draw the arrow head:
  c.beginPath();
  c.moveTo(150, 140);
  c.lineTo(130, 139);
  c.stroke();

  c.beginPath();
  c.moveTo(150, 140);
  c.lineTo(142, 156);
  c.stroke();

  c.beginPath();
  c.moveTo(130, 139);
  c.lineTo(142, 156);
  c.stroke();

  //Draw the circle that shows the end location:
  c.beginPath();
  c.arc(163, 135, 10, Math.PI * 2, false);
  c.stroke();
}

/*-----------------
4) Timing Functions
-------------------*/

//Starts the timer shown on the top left corner of the screen.
function startTimer() {
  //Get the current time.
  StartTime = new Date().getTime();

  //Do something on the interval of .5 seconds. That something is to update the clock.
  ClockInterval = setInterval(updateClock, 500);

  //Gets the difference between start and now time and sets the timer in the top left
  //corner of the screen to that value.
  function updateClock() {
    var now = new Date().getTime();
    var distance = now - StartTime;
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    if (minutes < 10) {
      minutes = "0" + minutes;
    }

    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    document.getElementById("timer").innerHTML = minutes + ":" + seconds;
  }
}

//Stops the timer in the top left corner of the screen and gets the difference between time at start and stop.
function stopTimer() {
  var now = new Date().getTime();
  var distance = now - StartTime;
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  var seconds = Math.floor(distance % (1000 * 60)) / 1000;
  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  //Stop doing the thing (that is getting the clock time) every .5 seconds.
  clearInterval(ClockInterval);

  var retStr = minutes + ":" + seconds;

  return retStr;
}

/*------------------
5) Startup Functions
--------------------*/

//Function called when game is opened.
function start() {
  //For mac and iphones, CSS needs some adjustment.
  adjustCSS();

  //Load up the first puzzle.
  load(PuzzleArray[CurrentPuzzle]);

  //Call to server to get scores for the first two puzzles (as the puzzle data itself is already in the client)
  getFirstTwoScores();

  //Prevents right click (Only in game area. Context menu isn't helpful when trying to click and drag aggressively)
  document.addEventListener("contextmenu", (event) => event.preventDefault());

  //Setup touch handling.
  initTouch();
}

//Adjusts CSS for better display on Mac and iphones.
function adjustCSS() {
  //If client is running on iphone, ipad, or ipod, change some font sizes and positions.
  if (
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i)
  ) {
    document.getElementById("logotxt").style["width"] = "220px";
    document.getElementById("logotxt").style["left"] = "20px";
    document.getElementById("initialstxt").style["width"] = "220px";
    document.getElementById("initialstxt").style["left"] = "20px";
    document.getElementById("initials").style["height"] = "25px";
    document.getElementById("initials").style["left"] = "90px";
    document.getElementById("createbtn").style["font-size"] = "24px";
    document.getElementById("playbtn").style["font-size"] = "24px";
    document.getElementById("fastesttxt").style["font-size"] = "14px";
    document.getElementById("shortesttxt").style["font-size"] = "14px";
  }

  //If client is running on a mac, make a few adjustments to font size and position.
  else if (navigator.appVersion.indexOf("Mac") != -1) {
    document.getElementById("logotxt").style["width"] = "220px";
    document.getElementById("logotxt").style["left"] = "40px";
    document.getElementById("initialstxt").style["width"] = "220px";
    document.getElementById("initialstxt").style["left"] = "40px";
    document.getElementById("initials").style["top"] = "175px";
    document.getElementById("createbtn").style["font-size"] = "24px";
    document.getElementById("playbtn").style["font-size"] = "24px";
    document.getElementById("fastesttxt").style["font-size"] = "14px";
    document.getElementById("shortesttxt").style["font-size"] = "14px";
    document.getElementById("timer").style["top"] = "-3px";
    document.getElementById("distance").style["top"] = "-3px";
  }
}

//Adds event listeners to respond to touch actions with a call of the function touchHandler.
function initTouch() {
  document.addEventListener("touchstart", touchHandler, false);
  document.addEventListener("touchmove", touchHandler, false);
  document.addEventListener("touchend", touchHandler, false);
  document.addEventListener("touchcancel", touchHandler, false);
}

/*-------------------------
6) Puzzle Loading Functions
---------------------------*/

//Tales the JSON data found in lines and loads it into the LineArray.
function load(lines) {
  //Parse the data.
  var ImportArray = JSON.parse(lines);

  //Empty the LineArray. Anything in LineArray is drawn on the screen.
  LineArray = [];

  //For each object found in the import array, push into the LineArray so it will be drawn.
  for (var i = 0; i < ImportArray.length; i++) {
    l = ImportArray[i];
    LineArray.push(
      new Line(l.startx, l.starty, l.endx, l.endy, l.dim, l.lineID)
    );
  }

  //Set FilledIn to false, reset the fill color and call the mainLoop.
  //This way, the shape will be filled in with the un-solved color in the main loop.
  FilledIn = false;
  Color4 = "#BF8B4B";
  Color2 = "#BF8B4B";
  mainLoop();
}

//Called by nextbtn(), this function loads up the next puzzle.
function next() {
  //Do these things if next is clicked after completing the first puzzle.
  if (CurrentPuzzle < 1) {
    CurrentPuzzle += 1;
    CurrentID += 1;
    //load the second puzzle.
    load(PuzzleArray[CurrentPuzzle]);
    //set the top results data to that for the second puzzle.
    top3Fastest = top3Fastest2;
    top3Shortest = top3Shortest2;
  }

  //Do these things if next is clicked after completing the second puzzle:
  else if (CurrentPuzzle == 1) {
    //Because this puzzle is user-generated, turn on the display to show who made it.
    document.getElementById("creator").style.visibility = "visible";
    //Load up a random puzzle from the database.
    getPuzzleFromDatabase();
    CurrentPuzzle += 1;
  }

  //Do these things if next is clicked after completing any puzzle beyoned the second one.
  else {
    //Load a random puzzle from the database.
    getPuzzleFromDatabase();
    CurrentPuzzle += 1;
  }
}

//This function is called by retrybtn(). Just loads last puzzle for a redo.
function last() {
  //If the current puzzle is the first or second, just get data from local array.
  if (CurrentPuzzle < 2) {
    load(PuzzleArray[CurrentPuzzle]);
  }
  //If it's not, reload the puzzle from the freshPuzzle array. The freshPuzzle just
  //stores data for an unaltered version of the current puzzle for recall.
  else {
    load(freshPuzzle);
  }
}

/*--------------------------------------
7) Lines Object Definition and Functions
----------------------------------------*/

//object defintion and drawing function for lines.
function Line(startx, starty, endx, endy, lineID) {
  this.endx = endx;
  this.endy = endy;
  this.startx = startx;
  this.starty = starty;
  this.lineID = lineID;

  this.drawline = function (color) {
    c.lineWidth = 2;
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo(this.startx, this.starty);
    c.lineTo(this.endx, this.endy);
    c.stroke();
  };
}

//Starts the preview line.
function linePreviewStart() {
  //Check to see if the line start is requested to be at an endpoint of
  //another line.
  var endpointSnap = isOnEndpoint();

  //If it is, set the start point to that endpoint.
  if (endpointSnap[0] == true) {
    PreviewStartx = endpointSnap[1];
    PreviewStarty = endpointSnap[2];
  }

  //If not, just set startpoint to mouse position.
  else {
    PreviewStartx = Mouse.x;
    PreviewStarty = Mouse.y;
  }
}

//Handles the preview line as the user drags around (before releasing to create a line)
function linePreviewDrag(mode) {
  var endx = 0;
  var endy = 0;

  //Create a new line object.
  previewLine = new Line(PreviewStartx, PreviewStarty, Mouse.x, Mouse.y, null);

  //Check to see if the endpoint is requested to be common to another line endpoint.
  var endpointSnap = isOnEndpoint();

  //If it is, make it so.
  if (endpointSnap[0] == true) {
    endx = endpointSnap[1];
    endy = endpointSnap[2];
  }
  //If not, make the endpoint the mouse position.
  else {
    endx = Mouse.x;
    endy = Mouse.y;
  }

  //Update the preview line end point.
  previewLine.endx = endx;
  previewLine.endy = endy;

  //draw the previewline.
  previewLine.drawline(Color2);
}

//Adds a new line to the LineArray.
function createNewLine() {
  //New line, increment the ElementID
  ElementID += 1;

  //Grab the end of the preview line.
  var lineendx = previewLine.endx;
  var lineendy = previewLine.endy;

  //Do a check to make sure the line is long enough - filters out accidental line creations.
  var lineLength = Math.sqrt(
    Math.pow(previewLine.startx - lineendx, 2) +
      Math.pow(previewLine.starty - lineendy, 2)
  );
  if (lineLength > 5) {
    //if it's a purposefully created line, add it to the LineArray!
    LineArray.push(
      new Line(
        previewLine.startx,
        previewLine.starty,
        lineendx,
        lineendy,
        ElementID
      )
    );
  }

  //clear the previewLine data:
  previewLine.startx = 0;
  previewLine.starty = 0;
  previewLine.endx = 0;
  previewLine.endy = 0;
}

/*----------------------------------------------
8) Endpoint Detection and Highlighting Functions
------------------------------------------------*/

//Checks if either the mouse location or xin, yin location are on an endpoint.
function isOnEndpoint(xin, yin, useAux) {
  //This is the distance that the mouse (or xin and yin) must be within to
  //be considered on an endpoint.

  var endpointSnapDist = 15;

  //If the Aux points (xin, yin) are used, it's not by a human. Reduce the snap distance for accuracy.
  if (useAux == true) {
    var x = xin;
    var y = yin;
    endpointSnapDist = 1;
  } else {
    var x = Mouse.x;
    var y = Mouse.y;
  }

  //For each line in the array, check to see if an endpoint is within endpointSnapDist of x,y.
  for (var i = 0; i < LineArray.length; i++) {
    l = LineArray[i];

    if (
      Math.pow(Math.pow(l.startx - x, 2) + Math.pow(l.starty - y, 2), 0.5) <
      endpointSnapDist
    ) {
      var sx = l.startx;
      var sy = l.starty;
      //Hightlight the endpoint.
      drawEndpoint(sx, sy);
      //Return the endpoint's coordinates for use in other functions.
      return [true, sx, sy];
    }

    if (
      Math.pow(Math.pow(l.endx - x, 2) + Math.pow(l.endy - y, 2), 0.5) <
      endpointSnapDist
    ) {
      var ex = l.endx;
      var ey = l.endy;
      //Highlight the endpoint
      drawEndpoint(ex, ey);
      //Return the endpoint's coordinates for use in other functions.
      return [true, ex, ey];
    }
  }

  //If no endpoint was found, return false.
  return [false, 0, 0];
}

//Draws a highlight around any coordinate pased into it.
function drawEndpoint(x_coord, y_coord) {
  c.beginPath();
  c.arc(x_coord, y_coord, 10, Math.PI * 2, false);
  c.fillStyle = Color3;
  c.fill();
}

/*------------------------
9) Endpoint Move Functions
--------------------------*/

//Finds the lines common to an endpoint and returns them.
function getEPs(epToMove) {
  //First, if it wasn't on an endpoint when clicked, do nothing.
  if (epToMove[0] == false) {
    return 0;
  }

  var linesToMove = [];

  //Make an array containing all of the lines with endpoints common to the selected node.
  for (var i = 0; i < LineArray.length; i++) {
    if (LineArray[i].endx == epToMove[1] && LineArray[i].endy == epToMove[2]) {
      linesToMove.push(["end", LineArray[i]]);
    } else if (
      LineArray[i].startx == epToMove[1] &&
      LineArray[i].starty == epToMove[2]
    ) {
      linesToMove.push(["start", LineArray[i]]);
    }
  }

  //Set the gloabal variable Dragging based on whether or not common endpoints have been found.
  if (linesToMove.length > 1) {
    Dragging = true;
  } else {
    Dragging = false;
  }

  return linesToMove;
}

//Takes the lines found using the above function and changes the start or endpoints accordingly.
function moveEPs(ep, wasx, wasy) {
  if (ep == 0) {
    return 0;
  }

  if (ep.length <= 1) {
    return 0;
  }

  //Clear the results:
  FilledIn = false;
  c.clearRect(0, 0, innerWidth, innerHeight);
  ImageData = c.getImageData(0, 0, canvas.width, canvas.height);
  Data = ImageData.data;

  //Move start or endpoint of the lines as needed.
  for (var i = 0; i < ep.length; i++) {
    if (ep[i][0] == "start") {
      ep[i][1].startx = Mouse.x;
      ep[i][1].starty = Mouse.y;
    } else if (ep[i][0] == "end") {
      ep[i][1].endx = Mouse.x;
      ep[i][1].endy = Mouse.y;
    }
  }

  //compare the start and endpoint of the move to find the distance travelled.
  Dist =
    Dist + Math.sqrt(Math.pow(wasx - Mouse.x, 2) + Math.pow(wasy - Mouse.y, 2));

  //Update the distance in the rop right corner of the screen.
  document.getElementById("distance").innerHTML = Dist.toFixed(0);

  //Since lines have been changed, redraw the screen.
  redraw();
}

/*-------------------------
10) Interior Fill Functions
---------------------------*/

//This function returns true if the region is closed and false if not.
function closed() {
  //No lines? not closed section.
  if (LineArray.length == 0) {
    return false;
  }

  NodesArray = [];

  //Add all endpoints to the node array.
  for (var i = 0; i < LineArray.length; i++) {
    l1 = LineArray[i];
    NodesArray.push([l1.startx, l1.starty], [l1.endx, l1.endy]);
  }

  //Find the number of endpoints common to a node.
  for (var i = 0; i < NodesArray.length; i++) {
    node = NodesArray[i];
    var commonEndpoints = 0;
    for (var j = 0; j < LineArray.length; j++) {
      l = LineArray[j];
      if (l.startx == node[0] && l.starty == node[1]) {
        commonEndpoints += 1;
      }
      if (l.endx == node[0] && l.endy == node[1]) {
        commonEndpoints += 1;
      }
    }

    //If the node has an odd number of conected lines, the shape isn't closed.
    if (commonEndpoints % 2 != 0) {
      return false;
    }
  }

  //All lines have an even number of connected lines - return true. It is closed.
  return true;
}

//Populates an array of Reiman sum rectanges based on lines data.
function FillIn() {
  //Defines "resolution of integration"
  var numberOfRects = 500;
  RectArray = [];

  var minx = 99999999;
  var maxx = 0;

  //Find the leftmost point:
  for (var i = 0; i < LineArray.length; i++) {
    if (LineArray[i].startx < minx) {
      minx = LineArray[i].startx;
    }
    if (LineArray[i].endx < minx) {
      minx = LineArray[i].endx;
    }
    if (LineArray[i].startx > maxx) {
      maxx = LineArray[i].startx;
    }
    if (LineArray[i].endx > maxx) {
      maxx = LineArray[i].endx;
    }
  }

  //Make a list of to calculate intercepts at.
  var centers = [];
  var xwidth = (maxx - minx) / numberOfRects;
  var currentx = minx + xwidth / 2;
  for (var i = 0; i < numberOfRects; i++) {
    centers.push(currentx);
    currentx = currentx + xwidth;
  }

  var mxb = [];

  //Go through line array and get m and b for each line.
  for (var i = 0; i < LineArray.length; i++) {
    var m = 0;
    var b = 0;
    if (LineArray[i].startx - LineArray[i].endx != 0) {
      m =
        (LineArray[i].starty - LineArray[i].endy) /
        (LineArray[i].startx - LineArray[i].endx);
      b = LineArray[i].starty - m * LineArray[i].startx;
    } else {
      m = "vert";
      b = "vert";
    }
    mxb.push([
      m,
      b,
      Math.min(LineArray[i].startx, LineArray[i].endx),
      Math.max(LineArray[i].startx, LineArray[i].endx),
    ]);
  }

  var yints = [];

  //For each center, find where line intercepts are.
  for (var i = 0; i < centers.length; i++) {
    centerx = centers[i];
    var yintspresort = [];
    for (var j = 0; j < mxb.length; j++) {
      m = mxb[j][0];
      b = mxb[j][1];
      var min = mxb[j][2];
      var max = mxb[j][3];
      if (centerx > min && centerx < max && m != "vert") {
        yintspresort.push(m * centerx + b);
      }
    }

    //sort the points in the yintspresort array by y value.
    yintspresort.sort(function (a, b) {
      return a - b;
    });

    for (var j = 0; j < yintspresort.length; j++) {
      yints.push([centerx, yintspresort[j]]);
    }
  }
  //Make pairs out of the points. Turn those into rectangle objects.
  for (var i = 0; i < yints.length; i = i + 2) {
    if (yints.length % 2 == 0) {
      var centerx = yints[i][0];
      var topy = yints[i][1];
      var bottomy = yints[i + 1][1];
      var centroidy = bottomy - (bottomy - topy) / 2;
      RectArray.push(
        new Rectangle(centerx, centroidy, xwidth, bottomy - topy, "black", 1)
      );
    }
  }
}

//Turn the rectanlges created in FillIn() into a snapshot so that the rectangles
//don't need to be drawn over and over again (very slow).
function fromRectsToPxs() {
  //Momentarily clear the screen:
  c.clearRect(0, 0, canvas.width, canvas.height);
  ImageData = c.getImageData(0, 0, canvas.width, canvas.height);
  Data = ImageData.data;

  rasterArray = [];

  //create rectArray rectangles:
  FillIn();

  //draw all of the rectangles.
  for (var i = 0; i < RectArray.length; i++) {
    r = RectArray[i];
    r.drawrect();
  }

  //Get those pixels into array form:
  ImageData = c.getImageData(0, 0, canvas.width, canvas.height);
  Data = ImageData.data;

  //If the pixels are not transparent (don't have an alpha value == 0), mark them as 'inside'
  //in the rasterArray.
  for (var index = 0; index < Data.length; index = index + 4) {
    if (Data[index + 3] != 0) {
      rasterArray[index / 4] = "inside";
    }
  }

  //For the pixels marked as inside, use the colorit function to change the color of the pixel
  //in the image data arrray.
  for (var index = 0; index < rasterArray.length; index++) {
    currentColor = rasterArray[index];
    if (currentColor == "inside") {
      colorit(index * 4);
    }
  }

  //Get rid of the rectangles.
  RectArray = [];
}

//Rectanlge object definition.
function Rectangle(cx, cy, b, w, color) {
  this.cx = cx;
  this.cy = cy;
  this.b = b;
  this.w = w;
  this.color = color;

  this.drawrect = function () {
    c.fillStyle = color;
    c.fillRect(cx - b / 2, cy - w / 2, b, w);
    c.stroke();
  };
}

//Changes the pixel in the image data array (Data) to Color4
function colorit(index) {
  RGB = hexToRGB(Color4);

  Data[index] = RGB[0]; // red
  Data[++index] = RGB[1]; // green
  Data[++index] = RGB[2]; // blue
  Data[++index] = 100; // alpha
}

//Takes a hex value and returns an RGB value.
function hexToRGB(h) {
  var r = "0x" + h[1] + h[2];
  var g = "0x" + h[3] + h[4];
  var b = "0x" + h[5] + h[6];

  return [+r, +g, +b];
}

/*---------------------------------------
11) Line Intersection Detection Functions
-----------------------------------------*/

//Returns true if instersections exist and false if they dont.
function intersections() {
  //Go through LineArray and calculate m and b for each line.
  for (var i = 0; i < LineArray.length; i++) {
    l1 = LineArray[i];
    var m1 = (l1.endy - l1.starty) / (l1.startx - l1.endx);
    var b1 = canvas.height - l1.starty - m1 * l1.startx;

    //Go through it again and calculate m and b for each line not the l1.
    for (var j = 0; j < LineArray.length; j++) {
      l2 = LineArray[j];
      var m2 = (l2.endy - l2.starty) / (l2.startx - l2.endx);
      var b2 = canvas.height - l2.starty - m2 * l2.startx;

      //x and y are the intersection of the two lines.
      var x = (b2 - b1) / (m1 - m2);
      var y = canvas.height - (m1 * x + b1);

      //Check to see if x and y are on the target line:
      var calcdLineLength1 = Math.sqrt(
        Math.pow(l1.startx - l1.endx, 2) + Math.pow(l1.starty - l1.endy, 2)
      );
      var dist_from_start1 = Math.sqrt(
        Math.pow(l1.startx - x, 2) + Math.pow(l1.starty - y, 2)
      );
      var dist_from_end1 = Math.sqrt(
        Math.pow(l1.endx - x, 2) + Math.pow(l1.endy - y, 2)
      );
      var closeness1 = Math.abs(
        calcdLineLength1 - dist_from_start1 - dist_from_end1
      );

      //Check to see if x and y are on the intersecting line:
      var calcdLineLength2 = Math.sqrt(
        Math.pow(l2.startx - l2.endx, 2) + Math.pow(l2.starty - l2.endy, 2)
      );
      var dist_from_start2 = Math.sqrt(
        Math.pow(l2.startx - x, 2) + Math.pow(l2.starty - y, 2)
      );
      var dist_from_end2 = Math.sqrt(
        Math.pow(l2.endx - x, 2) + Math.pow(l2.endy - y, 2)
      );
      var closeness2 = Math.abs(
        calcdLineLength2 - dist_from_start2 - dist_from_end2
      );

      //If an intersection is found that is not at an endpoint, return true.
      if (
        closeness1 < 0.01 &&
        closeness2 < 0.01 &&
        isOnEndpoint(x, y, true)[0] == false
      ) {
        redraw();
        return true;
      }
    }
  }
  //No intersections were found - return false.
  redraw();
  return false;
}

/*-----------------------------------------------
12) Mouse and Touch Event Listeners and Functions
-------------------------------------------------*/

//Sets global variable InputFreeze to true if the mouse is not in the canvas area.
function mouseInCanvas() {
  //Get the bounding rect for the canvas.
  var canvasBox = document.getElementById("canvas").getBoundingClientRect();

  var inMenuCanvas = false;
  var heightIn = false;
  var widthIn = false;

  //Do a simple check to see if width and height are in.
  if (Mouse.x > canvasBox.left && Mouse.x < canvasBox.right) {
    widthIn = true;
  }
  if (Mouse.y > canvasBox.top - 30 && Mouse.y < canvasBox.bottom - 30) {
    heightIn = true;
  }

  //Set InputFreeze accordingly.
  if (heightIn == true && widthIn == true) {
    InputFreeze = false;
  } else {
    InputFreeze = true;
    //Also, set dragging to false so that fill in will occur even if cursor leaves the canvas.
    Dragging = false;
  }
}

//Listener for mousemoves.
window.addEventListener("mousemove", function (event) {
  //Set mouse locations.
  canvasRect = canvas.getBoundingClientRect();
  Mouse.x = event.clientX - canvasRect.left;
  Mouse.y = event.clientY - canvasRect.top;

  //Determine dragging state:
  if (MouseState == "down") {
    MouseState = "dragging";
  } else if (MouseState == "dragging") {
    MouseState == "dragging";
  } else {
    MouseState = "moving";
  }

  //Run the main loop.
  mainLoop();
});

//Listener for mouse downs.
window.addEventListener("mousedown", function (event) {
  canvasRect = canvas.getBoundingClientRect();

  //Set mouse locations.
  Mouse.x = event.clientX - canvasRect.left;
  Mouse.y = event.clientY - canvasRect.top;

  MouseState = "down";

  //Run the main loop.
  mainLoop();
});

//Listener for mouse ups.
window.addEventListener("mouseup", function (event) {
  canvasRect = canvas.getBoundingClientRect();

  //Set mouse locations.
  Mouse.x = event.clientX - canvasRect.left;
  Mouse.y = event.clientY - canvasRect.top;

  MouseState = "up";

  //Run main loop.
  mainLoop();

  //Save the current mouse location - trigger a mouse move event using this.
  var currentmousex = Mouse.x;
  var currentmousey = Mouse.y;

  //Create and trigger a mouse move event at the last location of the mouse.
  //Why? Beacuse this was developed on a touchscreen laptop - meaning that an extra mousemove was
  //tagged onto every mouse up during development. Having unknowingly developed around this oddity,
  //I've chosen to simulate one to make sure that all other devices work correctly. Has no effect on
  //performance, just requires this ugly bit of code.

  var mouseMoveEvent = document.createEvent("MouseEvents");

  mouseMoveEvent.initMouseEvent(
    "mousemove", //event type : click, mousedown, mouseup, mouseover, mousemove, mouseout.
    true, //canBubble
    false, //cancelable
    window, //event's AbstractView : should be window
    1, // detail : Event's mouse click count
    currentmousex, // screenX
    currentmousey, // screenY
    currentmousex, // clientX
    currentmousey, // clientY
    false, // ctrlKey
    false, // altKey
    false, // shiftKey
    false, // metaKey
    1, // button : 0 = click, 1 = middle button, 2 = right button
    null // relatedTarget : Only used with some event types (e.g. mouseover and mouseout). In other cases, pass null.
  );

  document.dispatchEvent(mouseMoveEvent);
});

//This function takes touch events and translates them into simulated mouse clicks.
function touchHandler(event) {
  var touches = event.changedTouches;
  var first = touches[0];
  var type = "";

  switch (event.type) {
    case "touchstart":
      type = "mousedown";
      break;
    case "touchmove":
      type = "mousemove";
      break;
    case "touchend":
      type = "mouseup";
      break;
    default:
      return;
  }

  var simulatedEvent = document.createEvent("MouseEvent");
  simulatedEvent.initMouseEvent(
    type,
    true,
    true,
    window,
    1,
    first.screenX,
    first.screenY,
    first.clientX,
    first.clientY,
    false,
    false,
    false,
    false,
    0 /*left*/,
    null
  );

  first.target.dispatchEvent(simulatedEvent);
}

/*-------------------------------
13) Scoring and Ranking Functions
---------------------------------*/

function success() {
  //Stop the timer and get the total time and distance.
  var totalTime = stopTimer();
  var totalDist = Dist;

  //Set global FirstDown to true so that the timer will start during the next round upon a mousedown event.
  FirstDown = true;

  //Clear the info bar.
  document.getElementById("distance").innerHTML = "";
  document.getElementById("timer").innerHTML = "Success!";

  //Put the run data into the resultstxt area.
  document.getElementById("resultstxt").value =
    "Time: " + totalTime + "\nDist: " + totalDist.toFixed(1);

  //Check the ranking of the finish. Only does anything if finish is in to 3 for fastest or shortest.
  rankings(totalTime, Dist);

  //Hide the instruction text if first or second puzzle.
  if (FirstPuzzle == true) {
    FirstPuzzle = false;
    document.getElementById("playinstruction1").style.visibility = "hidden";
  }

  if (SecondPuzzle == false) {
    document.getElementById("playinstruction2").style.visibility = "hidden";
  }

  //show the results (it's a toggle from the not shown state)
  toggleResults();
}

//Checks to see if the finish was in the top3 for fastest or shortest solve for the puzzle.
function rankings(time, dist) {
  //To make comparisons easy, translate from a text string 00:00.000 format to number of seconds.
  var timeSeconds = toSeconds(time);

  //updateRequired will only be set to true if a new high score needs to be added.
  var updateRequired = false;

  //Go through the top3Fastest and if the time score beats any of them, put it in.
  for (var i = 0; i < 3; i++) {
    if (top3Fastest[i][1] != "---") {
      if (timeSeconds <= toSeconds(top3Fastest[i][1])) {
        top3Fastest.splice(i, 0, [Initials, time + "(You)"]);
        updateRequired = true;
        break;
      }
    } else {
      top3Fastest.splice(i, 0, [Initials, time + "(You)"]);
      updateRequired = true;
      break;
    }
  }

  //Go through the top3Shortest and if the dist score beats any of them, put it in.
  for (var i = 0; i < 3; i++) {
    if (top3Shortest[i][1] != "---") {
      if (dist <= parseFloat(top3Shortest[i][1])) {
        top3Shortest.splice(i, 0, [Initials, dist.toFixed(1) + "(You)"]);
        updateRequired = true;
        break;
      }
    } else {
      top3Shortest.splice(i, 0, [Initials, dist.toFixed(1) + "(You)"]);
      updateRequired = true;
      break;
    }
  }

  //trim off extra entries.
  while (top3Fastest.length > 3) {
    top3Fastest.pop();
  }
  while (top3Shortest.length > 3) {
    top3Shortest.pop();
  }

  //Update the rankings text.
  document.getElementById("fastesttxt").value =
    "Fastest:" +
    "\n   1) " +
    top3Fastest[0][0] +
    ": " +
    top3Fastest[0][1] +
    "\n   2) " +
    top3Fastest[1][0] +
    ": " +
    top3Fastest[1][1] +
    "\n   3) " +
    top3Fastest[2][0] +
    ": " +
    top3Fastest[2][1];

  document.getElementById("shortesttxt").value =
    "Shortest: " +
    "\n   1) " +
    top3Shortest[0][0] +
    ": " +
    top3Shortest[0][1] +
    "\n   2) " +
    top3Shortest[1][0] +
    ": " +
    top3Shortest[1][1] +
    "\n   3) " +
    top3Shortest[2][0] +
    ": " +
    top3Shortest[2][1];

  //If the run was fastest or shortest, the score in the database must be updated.
  if (updateRequired == true) {
    //Don't store the scores with the attached (You) marker
    for (var i = 0; i < top3Fastest.length; i++) {
      top3Fastest[i][1] = top3Fastest[i][1].replace("(You)", "");
      top3Shortest[i][1] = top3Shortest[i][1].replace("(You)", "");
    }

    //update the score data for this puzzle in the database.
    updateScoresInDatabase();
  }
}

//Takes a formatted mm:ss.xxx string and returns a float in seconds.
function toSeconds(time) {
  var minutes = parseFloat(time.substr(0, 2));
  var seconds = parseFloat(time.substr(3, 7));

  return minutes * 60 + seconds;
}

/*-----------------------
14) Button Click Handlers
-------------------------*/

//Handles the welcome screen play button click.
function playbtn() {
  //If the user submitted initials, set the global Initials to that value.
  Initials = document.getElementById("initials").value;

  //Set global to true so that nothing related to the welcome screen happens again.
  WelcomeClosed = true;

  //Format the initials string. Always 3 or fewer characters.
  if (Initials.length == 0) {
    Initials = "???";
  }
  if (Initials.length > 3) {
    Initials = Initials.substring(0, 3);
  }

  //Hide the dialogue.
  document.getElementById("welcome").style.visibility = "hidden";
  document.getElementById("logotxt").style.visibility = "hidden";
  document.getElementById("initialstxt").style.visibility = "hidden";
  document.getElementById("initials").style.visibility = "hidden";
  document.getElementById("playbtn").style.visibility = "hidden";
  document.getElementById("createbtn").style.visibility = "hidden";

  //Show the instructions for the first puzzle.
  document.getElementById("playinstruction1").style.visibility = "visible";

  //Set global to true so that things related to the First Puzzle happen.
  FirstPuzzle = true;

  //The main loop mode is set to play.
  Mode = "play";

  //Redraw so that instructions and help show up.
  redraw();
}

//Handles click on create button in welcome dialogue.
function createbtn() {
  //Same routine as for play button click for the intials. (See above)
  Initials = document.getElementById("initials").value;
  WelcomeClosed = true;

  if (Initials.length == 0) {
    Initials = "???";
  }
  if (Initials.length > 3) {
    Initials = Initials.substring(0, 3);
  }

  //Hide the elements of the dialogue.
  document.getElementById("welcome").style.visibility = "hidden";
  document.getElementById("logotxt").style.visibility = "hidden";
  document.getElementById("initialstxt").style.visibility = "hidden";
  document.getElementById("initials").style.visibility = "hidden";
  document.getElementById("playbtn").style.visibility = "hidden";
  document.getElementById("createbtn").style.visibility = "hidden";
  document.getElementById("timer").style.visibility = "hidden";
  document.getElementById("distance").style.visibility = "hidden";

  //Show the submit and clear buttons used in the create mode at the top of the window.
  document.getElementById("submitbtn").style.visibility = "visible";
  document.getElementById("clearbtn").style.visibility = "visible";

  //Show the instruction for create mode. hidden after 4 lines are drawn.
  document.getElementById("createinstruction1").style.visibility = "visible";

  //Clear the screen to get rid of the lines for the first puzzle.
  reset();

  //Set main loop mode to create.
  Mode = "create";
}

//Handles click on next button on success screen.
function nextbtn() {
  //If this is the second puzzle, show the instructions for it.
  if (SecondPuzzle == true) {
    document.getElementById("playinstruction2").style.visibility = "visible";
  }

  SecondPuzzle = false;

  //Hide the results, resets the distance, and load the next puzzle.
  toggleResults();
  Dist = 0;
  next();
}

//Handles click on retry button on success screen.
function retrybtn() {
  //Hides the results, rests the distance, and reloads the last puzzle.
  toggleResults();
  Dist = 0;
  last();
}

//Handles submit button click at top right of screen in create mode.
function submitbtn() {
  //Display alert if not closed or has no overlapping lines.
  if (closed() == false) {
    alert(
      "Shape must be closed before it can be sumitted. All nodes must connect an even number of lines."
    );
  } else if (intersections() == false) {
    alert(
      "This shape has no overlapping lines. Pretty boring puzzle. Cannot be subimtted."
    );
  } else {
    //If it passes all checks, upload it to the database.
    sendToDatabase();
  }
}

//Handles clear button click at top left of screen in create mode.
function clearbtn() {
  //Just clears the creen.
  reset();
}

//Empties arrays for drawn objects, clears the image data array, and redraws.
function reset() {
  LineArray = [];
  NodesArray = [];

  //Clear the screen:
  c.clearRect(0, 0, canvas.width, canvas.height);
  ImageData = c.getImageData(0, 0, canvas.width, canvas.height);
  Data = ImageData.data;

  redraw();
}

//If the results are shown, hide them. If they aren't, show them.
function toggleResults() {
  //If the gloabl ResultsDisplayed is false, show the results.
  if (ResultsDisplayed == false) {
    document.getElementById("fastesttxt").style.visibility = "visible";
    document.getElementById("shortesttxt").style.visibility = "visible";
    document.getElementById("results").style.visibility = "visible";
    document.getElementById("resultstxt").style.visibility = "visible";
    document.getElementById("nextbtn").style.visibility = "visible";
    document.getElementById("retrybtn").style.visibility = "visible";

    ResultsDisplayed = true;
  }

  //Do the opposite.
  else {
    document.getElementById("distance").innerHTML = 0;
    document.getElementById("timer").innerHTML = "00:00";

    document.getElementById("fastesttxt").style.visibility = "hidden";
    document.getElementById("shortesttxt").style.visibility = "hidden";
    document.getElementById("results").style.visibility = "hidden";
    document.getElementById("resultstxt").style.visibility = "hidden";
    document.getElementById("nextbtn").style.visibility = "hidden";
    document.getElementById("retrybtn").style.visibility = "hidden";

    ResultsDisplayed = false;
  }
}

/*----------------------------------
15) Database Communication Functions
------------------------------------*/

//This function gets a random puzzle from the database.
function getPuzzleFromDatabase() {
  //Create a new http request and point it towards the /getPuzzle function.
  //Put nothing in the request (the function has no arguments), and send.
  var ourRequest = new XMLHttpRequest();
  ourRequest.open("POST", "https://derickthomas.pythonanywhere.com/getPuzzle");
  ourRequest.setRequestHeader("Content-type", "text/plain");
  ourRequest.send("");

  //Once the request gets back, do these things.
  ourRequest.onload = function () {
    //If there is a communication issue with the server, display an alert.
    if (ourRequest.status != 200) {
      alert("Unable to get a new puzzle from the interwebs. :(");
      return -1;
    }

    //Set dataTxt to the returned string.
    var dataTxt = ourRequest.responseText;

    //split the data up using a special identifier.
    var data = dataTxt.split("-,-");

    //The ID of the puzzle is saved as the current ID.
    CurrentID = parseInt(data[0]);

    //The author credit is set to the initials of the author found in the database.
    document.getElementById("creator").innerHTML = "Puzzle Creator: " + data[1];

    //Populate the top3 data to be compared to after a run.
    top3Fastest = [];
    for (var i = 3; i < 9; i = i + 2) {
      top3Fastest.push([data[i], data[i + 1]]);
    }
    top3Shortest = [];
    for (var i = 9; i < 15; i = i + 2) {
      top3Shortest.push([data[i], data[i + 1]]);
    }

    //Save the puzzle in the gloabal freshPuzzle in case an unchanged version is needed later.
    freshPuzzle = data[2];

    //load the puzzle.
    load(data[2]);

    return true;
  };
}

//Sends a newly created puzzle to the database.
function sendToDatabase() {
  //Create a new http request and point it towards the /addPuzzle function.
  var ourRequest = new XMLHttpRequest();

  //Create an array to be sent in the body of the request.
  sendArray = [
    "0",
    Initials,
    JSON.stringify(LineArray),
    "???",
    "---",
    "???",
    "---",
    "???",
    "---",
    "???",
    "---",
    "???",
    "---",
    "???",
    "---",
  ];

  //Sent it!
  ourRequest.open("POST", "https://derickthomas.pythonanywhere.com/addPuzzle");
  ourRequest.setRequestHeader("Content-type", "text/plain");
  ourRequest.send(sendArray);

  //Once the request gets back, alert the user that the puzzle has been uploaded.
  ourRequest.onload = function () {
    //If there is a communication issue with the server, display an alert.
    if (ourRequest.status != 200) {
      alert(
        "It looks like communication with the server is borked. Could not save your shape. :("
      );
      return -1;
    }

    alert("Puzzle uploaded successfully. Thanks!");
  };
}

//Gets the top3 scores for the first two puzzles.
//Since these puzzles are not pulled down from the database, the scores need to be pulled
//seperately at startup.
function getFirstTwoScores() {
  //This is done for both the first and second puzzles.

  //For puzzle 1:
  var puzzleID = 1;

  //Create a request and point it at the getScores function
  var Request1 = new XMLHttpRequest();

  Request1.open("POST", "https://derickthomas.pythonanywhere.com/getScores");
  Request1.setRequestHeader("Content-type", "text/plain");
  Request1.send(puzzleID);

  //Once the request gets back, parse the scores string and assign to arrays.
  Request1.onload = function () {
    var dataTxt = Request1.responseText;
    var data = dataTxt.split("-,-");

    top3Fastest1 = [];
    for (var i = 3; i < 9; i = i + 2) {
      top3Fastest1.push([data[i], data[i + 1]]);
    }

    top3Shortest1 = [];
    for (var i = 9; i < 15; i = i + 2) {
      top3Shortest1.push([data[i], data[i + 1]]);
    }

    //Because this happens at startup, we always want the top3Fastest/Shortest to be those
    //for the first puzzle.
    top3Fastest = top3Fastest1;
    top3Shortest = top3Shortest1;
  };

  //Same routine performed for the second puzzle.
  puzzleID = 2;

  var Request2 = new XMLHttpRequest();

  Request2.open("POST", "https://derickthomas.pythonanywhere.com/getScores");
  Request2.setRequestHeader("Content-type", "text/plain");
  Request2.send(puzzleID);

  //Once the request gets back, parse the scores data and save to arrays.
  Request2.onload = function () {
    //If there is a communication issue with the server, display an alert.
    if (Request2.status != 200) {
      alert("It looks like communication with the server is borked. :(");
      return -1;
    }

    var dataTxt = Request2.responseText;
    var data = dataTxt.split("-,-");

    top3Fastest2 = [];
    for (var i = 3; i < 9; i = i + 2) {
      top3Fastest2.push([data[i], data[i + 1]]);
    }

    top3Shortest2 = [];
    for (var i = 9; i < 15; i = i + 2) {
      top3Shortest2.push([data[i], data[i + 1]]);
    }
  };
}

//Updates the scores data for the current puzzle in the database.
function updateScoresInDatabase() {
  //Create an http request and point it at the updateScores function.
  var ourRequest = new XMLHttpRequest();

  //Create an array to send the updated top3 data.
  sendArray = [
    CurrentID,
    top3Fastest[0][0],
    top3Fastest[0][1],
    top3Fastest[1][0],
    top3Fastest[1][1],
    top3Fastest[2][0],
    top3Fastest[2][1],
    top3Shortest[0][0],
    top3Shortest[0][1],
    top3Shortest[1][0],
    top3Shortest[1][1],
    top3Shortest[2][0],
    top3Shortest[2][1],
  ];

  ourRequest.open(
    "POST",
    "https://derickthomas.pythonanywhere.com/updateScores"
  );
  ourRequest.setRequestHeader("Content-type", "text/plain");
  ourRequest.send(sendArray);

  //Do nothing when request comes back, unless there was an error.
  ourRequest.onload = function () {
    if (ourRequest.status != 200) {
      alert(
        "It looks like communication with the server got messed up - your score was not saved :("
      );
    }
    return 0;
  };
}

/*------------------------------------
16) Utility Functions
These functions allow the user to directly download or load shapes.
Left here for use in future work.
Uncomment the rest of the code in this document and
	<!--input type='file'; id='fileinput' class='file'></input>
	<span class ="download" id="download" onclick="download()">download</span-->
in Node_Knot.html to use.
Note that the buttons appear out of range of the 310 x 310 iframe this game typically runs in.
--------------------------------------*/

/*
function download() {
    let dataStr = JSON.stringify(LineArray);
    let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    let exportFileDefaultName = 'data.json';
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
document.getElementById('fileinput').onchange = function() {
    loadFile();
};
function loadFile(){
	FilledIn = false
    c.clearRect(0,0,innerWidth, innerHeight)
    ImageData = c.getImageData(0, 0, canvas.width, canvas.height)
    Data = ImageData.data
	Color4 = '#BF8B4B'
    var input, file, fr;
	input = document.getElementById('fileinput');
	file = input.files[0];
	CurrentFileName = file.name;
	fr = new FileReader();
	fr.onload = receivedText;
	fr.readAsText(file);
    function receivedText(e) {
      let lines = e.target.result;
      var ImportArray = JSON.parse(lines);
		LineArray = [];
		for(var i = 0; i < ImportArray.length; i++){
			l = ImportArray[i];
			LineArray.push(new Line(l.startx, l.starty, l.endx, l.endy, l.dim, l.lineID));
		}
	mainLoop()
	}
}
*/
