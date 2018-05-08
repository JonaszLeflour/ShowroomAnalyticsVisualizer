



  // Replace with your view ID.
var VIEW_ID = 'ga:130279738';        
var jsonObj;
var ypos;
var xpos;
var apartment = "J304";
//var imgPath = 'img/map_placeholder.png';
var imgPath = 'img/J304_floor1.png';
var imgLoaded = false;
var queryDone = false;
var floorImg = document.getElementById("layer1");
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
	
    var canvasGL = document.getElementById("layer2");
	var canvasGL2 = document.getElementById("floor2_layer2");
	
	var ctxGL = canvasGL.getContext("webgl");
	var ctxGL2 = canvasGL2.getContext("webgl");
	
	//var ctx2D = canvas.getContext("2d");
	ctxGL.canvas.width = ctxGL2.canvas.width = floorImg.width;//ctxGL.canvas.width = ctx2D.canvas.width;
	ctxGL.canvas.height = ctxGL2.canvas.height = floorImg.height;//ctxGL.canvas.height = ctx2D.canvas.height;
	
    var heatmap = createWebGLHeatmap({canvas: canvasGL, intensityToAlpha:true});
	var heatmap2 = createWebGLHeatmap({canvas: canvasGL2, intensityToAlpha:true});
	
	var maxTime = 0;
	var floor1Separation = 400;
	
	var maxIntensity = document.getElementById("maxIntensity").value;//= 5000;
	var radius = document.getElementById("radius").value;//=200
	
	var time;
	//find maximum amount of time in room
	for (let i = 0; i < jsonObj.reports[0].data.rows.length; i++ ) {
		if(jsonObj.reports[0].data.rows[i].dimensions[1] == teleportEvent
			&& jsonObj.reports[0].data.rows[i].dimensions[3] == apartment){
			time = parseInt(jsonObj.reports[0].data.rows[i].metrics[0].values[3]);
			maxTime = Math.max(maxTime,Math.min(maxIntensity,time));	
		}
	}
	
	var corner1_J304 = [-300,-880,0];
	var corner2_J304 = [270,880,300];
	
	
	var translateX = 300;//var translateX = -corner1_J304[0];
	var translateY = 880;//var translateY = -corner1_J304[1];
	var apartmentWidth = 270 + 300;//var apartmentWidth = corner2_J304[0] - corner2_J304[0];
	var apartmentHeight = 880 + 880;//var apartmentHeight = corner2_J304[1]-corner2_J304[1];
	scaleX = floorImg.width / apartmentWidth;
	scaleY = floorImg.height / apartmentHeight;
	
	//console.log("canvas="+ctx2D.canvas.width+", "+ctx2D.canvas.height);
	
	for (let i = 0; i < jsonObj.reports[0].data.rows.length; i++ ) {
        //console.log(jsonObj.reports[0].data.rows[i].metrics[0].values);
		var apartmentName = jsonObj.reports[0].data.rows[i].dimensions[3];
		var eventAction = jsonObj.reports[0].data.rows[i].dimensions[1];
				
		if((eventAction == teleportEvent) && (apartmentName == apartment)){
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
			
			
			
					//console.log(apartmentName+" "+eventAction+" "+"x="+xpos+" y="+ypos+" int="+intense);
			if(zpos > floor1Separation){
				heatmap.addPoints([{x:xpos, y:ypos, size:radius*scaleX, intensity:intense}]);
			}
			else{
				heatmap2.addPoints([{x:xpos, y:ypos, size:radius*scaleX, intensity:intense}]);
			}
			
		}
	}
	heatmap.update();heatmap2.update();
	heatmap.display();heatmap2.display();
}
  

  
  



//return the specified map corners' 3D level cordinates
function getCorners(apartmentName, topLeft, bottomRight){
	topLeft = [0,0,0];
	bottomRight = [0,0,0];
	
	
}



