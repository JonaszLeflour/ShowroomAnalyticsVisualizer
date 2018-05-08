// Replace with your view ID.
var VIEW_ID = 'ga:130279738';        
var jsonObj;
var ypos;
var xpos;

//var imgPath = 'img/map_placeholder.png';
var imgPath = 'img/J304_floor1.png';
var imgLoaded = false;
var queryDone = false;
var floorImg = document.getElementById("layer1");
var floor2Img = document.getElementById("floor2_layer1");
var floorImgs = [floorImg,floor2Img];
floorImg.onload = function(){imgLoaded=true;if(queryDone){drawHeatmap();};}

var teleportEvent = "TeleportingOut";

var imgWidth;
var imgHeight;
var mapBackGround;


var queryResponse;
var canvas;
var scaleX;
var scaleY;
var translateX ;
var translateY;
var mirrorYAxis = true;
var apartmentsInfo = new Map();
var canvasIDs = ["layer2","floor2_layer2"];
var canvasArray = [document.getElementById(canvasIDs[0]),
	document.getElementById(canvasIDs[1])];


apartmentsInfo.set("J304", 
	{
		levelName:"J304",
		nbFloors:2,
		imgPaths:['img/J304_floor1.png','img/J304_floor2.png'],
		upperLeftCorner:[[-300,-880,0],[-300,-880,300]],
		lowerRighCorner:[[270,880,300],[270,880,600]]
	});
apartmentsInfo.set("I801", 
	{
		levelName:"I801",
		nbFloors:1,
		imgPaths:['img/I801_t.png'],
		upperLeftCorner:[[0,0,0]],
		lowerRighCorner:[[0,0,0]]
	});
apartmentsInfo.set("E1501", 
	{
		levelName:"E1501_ny",
		nbFloors:1,
		imgPaths:['img/E1501_t.png'],
		upperLeftCorner:[[-480,-720,0]],
		lowerRighCorner:[[290,910,250]]
	});
apartmentsInfo.set("E1602", 
	{
		levelName:"E1602",
		nbFloors:1,
		imgPaths:['img/E1602_t.png'],
		upperLeftCorner:[[-530,-1790,0]],
		lowerRighCorner:[[520,1440,270]]
	});
apartmentsInfo.set("M802", 
	{
		levelName:"M802",
		nbFloors:1,
		imgPaths:['img/M802_t.png'],
		upperLeftCorner:[[-550,-530,0]],
		lowerRighCorner:[[460,430,200]]
	});
apartmentsInfo.set("N602", 
	{
		levelName:"N602",
		nbFloors:1,
		imgPaths:['img/N602_t.png'],
		upperLeftCorner:[[-350,-720,0]],
		lowerRighCorner:[[365,570,270]]
	});
apartmentsInfo.set("N605", 
	{
		levelName:"N605",
		nbFloors:1,
		imgPaths:['img/N605_t.png'],
		upperLeftCorner:[[-570,-1010,0]],
		lowerRighCorner:[[470,930,250]]
	});
apartmentsInfo.set("I701", 
	{
		levelName:"I1701",
		nbFloors:1,
		imgPaths:['img/I701_t.png'],
		upperLeftCorner:[[-414,-993,0]],
		lowerRighCorner:[[576,690,250]]
	});
	
var apartment = apartmentsInfo.get("J304");
apartmentNames = ["J304","I701","M802","N602","N605"];

var apartmentSelect = document.getElementById("apartmentSelect");


apartmentSelect.addEventListener('change', function(evt) {
	var val = apartmentSelect.options[apartmentSelect.selectedIndex].value;
	apartment = apartmentsInfo.get(val);
	
	for(let i = 0; i< apartment.nbFloors; i++){
		floorImgs[i].onload = function(){imgLoaded=true;if(queryDone){drawHeatmap();};}
		floorImgs[i].src = apartment.imgPaths[i];
		floorImgs[i].style.display = "initial";
		canvasArray[i].style.display = "initial";
	}
	for(let i = apartment.nbFloors; i< floorImgs.length; i++){
		floorImgs[i].style.display = "none";
		canvasArray[i].style.display = "none";
		
	}
	
});

document.getElementById("maxIntensity").addEventListener('input', function (evt) {
    drawHeatmap();
});
document.getElementById("radius").addEventListener('input', function (evt) {
    drawHeatmap();
});








  // Query the API and print the results to the page.
  function queryReports() {
	console.log("query");
    gapi.client.request({
      path: '/v4/reports:batchGet',
      root: 'https://analyticsreporting.googleapis.com/',
      method: 'POST',
      body: {
        reportRequests: [
          {
            viewId: VIEW_ID,
            dateRanges: [
              {
                startDate: '30daysAgo',
                endDate: 'today'
              }
            ],
			dimensions: [
				{name: 'ga:eventCategory'},
				{name: 'ga:eventAction'},
				{name: 'ga:eventLabel'},
                {name: 'ga:dimension1'}
			],
			/*dimensionFilterClauses: [{
				filters: [{
					dimensionName: 'ga:eventAction',
					operator: 'EXACT',
					expressions: ["TeleportingOut"]
				},
				{
					dimensionName: 'ga:dimension1',
					operator: 'EXACT',
					expressions: [apartment]
				}]
			}],*/
			metrics: [
				{expression: 'ga:metric1'},
				{expression: 'ga:metric2'},
				{expression: 'ga:metric3'},
                {expression: 'ga:eventValue'}
			]
          }
        ]
      }
    }).then(displayResults, console.error.bind(console));
  }
        
  function displayResults(response) {
	console.log(response);
	queryResponse = response;
	queryDone = true;
	if(imgLoaded){
		drawHeatmap();
	}
  }
  
function drawHeatmap(){
	if(!(queryDone && imgLoaded)){
		return;
	}
	var formattedJson = JSON.stringify(queryResponse.result, null, 2);
    jsonObj = JSON.parse(formattedJson);
	
	var ctxArray = [];
	var heatmapArray = [];
	for(let i = 0; i < apartment.nbFloors; i++){
		ctxArray.push(canvasArray[i].getContext("webgl"));
		//resize canvas to fit background img
		ctxArray[i].canvas.width = floorImg.width;
		ctxArray[i].canvas.height = floorImg.height;
		console.log("img: "+floorImg.width+", "+floorImg.height);
		heatmapArray[i] = createWebGLHeatmap({canvas: canvasArray[i], intensityToAlpha:true});
	}
	var maxTime = 0;
	var floor1Separation = apartment.lowerRighCorner[0][2];
	var maxIntensity = document.getElementById("maxIntensity").value;//= 5000;
	var radius = document.getElementById("radius").value;//=200
	var time;
	
	var translateX = -apartment.upperLeftCorner[0][0];//300;//var translateX = -corner1_J304[0];
	var translateY = -apartment.upperLeftCorner[0][1];//880;//var translateY = -corner1_J304[1];
	var apartmentWidth = apartment.lowerRighCorner[0][0]-apartment.upperLeftCorner[0][0];//270 + 300;//var apartmentWidth = corner2_J304[0] - corner2_J304[0];
	var apartmentHeight = apartment.lowerRighCorner[0][1]-apartment.upperLeftCorner[0][1];//880 + 880;//var apartmentHeight = corner2_J304[1]-corner2_J304[1];
	scaleX = floorImg.width / apartmentWidth;
	scaleY = floorImg.height / apartmentHeight;
	
	//find maximum amount of time in room, can't exceed maxIntensity
	for (let i = 0; i < jsonObj.reports[0].data.rows.length; i++ ) {
		if(jsonObj.reports[0].data.rows[i].dimensions[1] == teleportEvent
			&& jsonObj.reports[0].data.rows[i].dimensions[3] == apartment.levelName){
			time = parseInt(jsonObj.reports[0].data.rows[i].metrics[0].values[3]);
			maxTime = Math.max(maxTime,Math.min(maxIntensity,time));	
		}
	}
	
	for (let i = 0; i < jsonObj.reports[0].data.rows.length; i++ ) {
        //console.log(jsonObj.reports[0].data.rows[i].metrics[0].values);
		var apartmentName = jsonObj.reports[0].data.rows[i].dimensions[3];
		var eventAction = jsonObj.reports[0].data.rows[i].dimensions[1];
				
		if((eventAction == teleportEvent) && (apartmentName == apartment.levelName)){
			xpos = parseInt(jsonObj.reports[0].data.rows[i].metrics[0].values[0]);
			ypos = parseInt(jsonObj.reports[0].data.rows[i].metrics[0].values[1]);
			zpos = parseInt(jsonObj.reports[0].data.rows[i].metrics[0].values[2]);
			time = parseInt(jsonObj.reports[0].data.rows[i].metrics[0].values[3]);
			var intense = Math.min(1,Math.max(0,(time/maxTime)));
			xpos += translateX;
			ypos += translateY;
			xpos *= scaleX;
			ypos *= scaleY;
			if(mirrorYAxis){
				ypos = floorImg.height - ypos;
			}
			
			//todo : for more than 2 floors, create new canvas
			
			//use for new data
			/*if((apartment.nbFloors>1) && (zpos > floor1Separation)){
				heatmapArray[1].addPoints([{x:xpos, y:ypos, size:radius*scaleX, intensity:intense}]);
			}
			else{
				heatmapArray[0].addPoints([{x:xpos, y:ypos, size:radius*scaleX, intensity:intense}]);
			}*/
			
			//dirty fix. Use on old data
			if((apartment.nbFloors>1) && (zpos < floor1Separation)){
				heatmapArray[1].addPoints([{x:xpos, y:ypos, size:radius*scaleX, intensity:intense}]);
			}
			else{
				heatmapArray[0].addPoints([{x:xpos, y:ypos, size:radius*scaleX, intensity:intense}]);
			}
			
			//Use on new data
			/*if(zpos > floor1Separation){
				heatmapArray[0].addPoints([{x:xpos, y:ypos, size:radius*scaleX, intensity:intense}]);
			}
			else{
				heatmapArray[0].addPoints([{x:xpos, y:ypos, size:radius*scaleX, intensity:intense}]);
			}*/
			
		}
	}
	for(let i = 0; i < apartment.nbFloors; i++){
		heatmapArray[i].update();
		heatmapArray[i].display();
	}
}











