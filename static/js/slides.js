


	var index = 0;          // current canvas index
	var slideNum = -1;      // slides number


	var processingInstance;

	var shapes;             // the draw object on canvas, replaced with an popup layer when mouseUp
	var shapeNum = [];      // draw object number for each canvas

	var currentType = "";   // "rect" "arrow" "ellipse" "dash" "brush"
	var lineWidth = 10; 	// line width

	var isDrawMode = false;  // if it is in drawing mode
	var isDrawing = false;   // if it is drawing now!

	// append it inside each object
	var functionDiv = "<div class='scaleControl'></div>\
						<div class='deletePic'>\
							<div class='deleteBtn'></div>\
							<div class='text'>\
								<span>Really?</span>\
								<a click='' class='do_click'>Yes</a>\
								<span>/</span>\
								<a click='' class='cancel_click'>No</a>\
							</div>\
						</div>";



	$('.toolbar ul li.tool').click(function(e){
		if($(this).hasClass("active")){
			setUnDrawing();
		}
		else{
			setDrawing($(this));
			showDrawCanvas();

			if ($(this).hasClass("addRect"))
				currentType = "rect";
			else if ($(this).hasClass("addArrow"))
				currentType = "arrow";
			else if ($(this).hasClass("addEllipse"))
				currentType = "ellipse";
			else if ($(this).hasClass("addDash"))
				currentType = "dash";
			else if ($(this).hasClass("addBrush"))
				currentType = "brush";
		}
			
	});

	$(".addCanvas").click(function(){
		setUnDrawing();
		addSlides();
	});

	function showDrawCanvas(){
		$(".drawCanvas").css("display","block");
		$(".slide.present").addClass("cursor");
		var canvas = document.getElementById("canvas"+index);
		processingInstance = new Processing(canvas, drawObj);
		processingInstance.background(255,255,255,0);
	}
	function hideDrawCanvas(){
		$(".drawCanvas").css("display","none");
		$(".slide.present").removeClass("cursor");
		processingInstance = null;
	}


	function setDrawing(obj){
		isDrawMode = true;
		resetToolbarStyle(obj);
		obj.addClass("active");
	}
	function setUnDrawing(){
		isDrawMode = false;
		resetToolbarStyle();
	}
	function resetToolbarStyle(){
		$('.toolbar ul li').removeClass("active");
	}




	var createSlide = (function(){

		var width = 480;
		var height = 480;

		return function(num){

			var $slide = $("<div id='dropzone"+num+"' class='wboard step slide rebuild' >\
				<span class='slidenum' id='slidenum"+num+"'>"+numberTwo(num+1)+"</span>\
				<canvas resize class='drawCanvas' style='display:none'></canvas>\
				</div>");
			
			if(slideNum == 0)
				$slide.addClass("present");
			else if(slideNum > 0)
				$slide.addClass("future");

			function numberTwo(n){
				if (n<10) {
					return '0'+n;
				};
				return n;
			}

			shapeNum[num] = 0;


			var tempcanvas = document.createElement('canvas');
			tempcanvas.width = width;
			tempcanvas.height = height;
			tempcanvas.addClass("drawCanvas");
			tempcanvas.id = "canvas"+num;

			processingInstance = new Processing(tempcanvas, drawObj);

			$slide.append(tempcanvas);

			return $slide;
		}

	})();
	
	
			
	function drawObj(processing){

		processing.size( 480, 480 );
		processing.smooth();
		processing.background(255,255,255,0);
		processing.stroke(220,220,220);
		processing.strokeWeight(lineWidth);
		processing.strokeCap(processing.SQUARE);
		processing.noFill();
		processing.noLoop();

		shapes = new MyShape(currentType, 0, 0, 0, 0);

		processing.draw = function (){

			setProcessingStyle(processing);

			switch(currentType){
				case "rect":
					processing.rect(shapes.x,shapes.y,shapes.width,shapes.height);
					break;
				case "ellipse":
					processing.ellipse(shapes.x+shapes.width/2,
									   shapes.y+shapes.height/2,
									   shapes.width,
									   shapes.height);
					break;
				case "arrow":
					drawArrow(shapes.x,shapes.y,shapes.width,shapes.height,processing);
					break;
				case "brush":
					drawBrush(shapes.arrayX, shapes.arrayY,processing);
					break;
				case "dash":
					drawDash(shapes.x,shapes.y,shapes.width,shapes.height,processing);
					break;
			}

		}
		processing.mousePressed = function () {
			if(isDrawMode){
				isDrawing = true;

				if(currentType == "brush"){
					shapes.arrayX[0] = processing.mouseX;
					shapes.arrayY[0] = processing.mouseY;
				}

				shapes.init(currentType, processing.mouseX, processing.mouseY);
			}
		}
		processing.mouseDragged = function () {

			if(isDrawMode && processing.mousePressed){

				if(currentType == "brush"){
					shapes.setArray(processing.mouseX, processing.mouseY);
				}
				else{
					shapes.setWH(processing.mouseX, processing.mouseY);
				}
				processing.redraw();
				//shapes.display();
			}
		}
		processing.mouseReleased = function () {
			hideDrawCanvas();

			if(isDrawMode){

				if(currentType == "brush"){
					shapes.setArray(processing.mouseX, processing.mouseY);
				}
				else{
					shapes.setWH(processing.mouseX, processing.mouseY);
				}

				setUnDrawing();

				if(currentType == "brush")
					shapes.reDisplay();
				else if(currentType == "rect" || currentType == "ellipse")
					shapes.reDisplayBox();
				
				isDrawing = false;

				// popup a draw object
				if(shapes.width!=0){
					var $html = createDrawObject(shapeNum[index],shapes);
					$html.insertBefore("#canvas"+index);
				}
				else{

				}

				
				updatePreview();
				shapeNum[index] ++;
			}
		}

	}




	addSlides();

	

	function addSlides(){
		slideNum++;
		//index = slideNum;

		var $slide = createSlide(slideNum);
		$('.slides').append($slide);

		if(slideNum > 0){
			nextSlide();
		}

/*
			$slide.bind('dragenter', dragStyle, false);
			$slide.bind('dragover', dragStyle, false);
			$slide.bind('dragleave', removeDragStyle, false);
			$slide.bind('drop', droppedImage, false);

			// 这样写不行= =
			
			*/


		document.getElementById('dropzone'+index).addEventListener('dragenter', dragStyle);
		document.getElementById('dropzone'+index).addEventListener('dragover', dragStyle);
		document.getElementById('dropzone'+index).addEventListener('dragleave', removeDragStyle);
		document.getElementById('dropzone'+index).addEventListener('drop', droppedImage);

		function droppedImage(e){

			removeDragStyle(e);

			var parentOffset = $(this).parent().offset(); 
			var x = e.pageX - parentOffset.left;
			var y = e.pageY - parentOffset.top;

			if ( ! e.dataTransfer.files.length ) {  //drop img from left list

				var data = e.dataTransfer.getData('text/plain');
				if(data){
					data = JSON.parse(data);
				}
				var $box = createImageBox(data.src, x, y);
				$box.insertBefore($("#canvas"+index));

			}
			else{  //drop img from desktop

				var reader = new FileReader();
				reader.onload = function(evt) {
					
					var $box = createImageBox(evt.target.result, x, y);
					$box.insertBefore($("#canvas"+index));

				};
				reader.readAsDataURL(e.dataTransfer.files[0]);
			}
		}

		function dragStyle(e){
			e.stopPropagation();
			e.preventDefault();

			if ( $("#tip").length == 0 )
				$("<p id='tip'>Drag & drop image from left list or your disk folders</p>").insertBefore($("#canvas"+index));
			
			$("#dropzone"+index).addClass('rounded').css("z-index",100);
		}
		function removeDragStyle(e){
			e.stopPropagation();
			e.preventDefault();
			$("#tip").remove();
			$("#dropzone"+index).removeClass('rounded').css("z-index",0);
		}

		$('#dropzone'+index).dblclick(function(e){
			e.stopPropagation();

			var parentOffset = $(this).parent().offset(); 
			var x = e.pageX - parentOffset.left;
			var y = e.pageY - parentOffset.top;

			var $box = createTextBox(x,y);
			$box.insertBefore($("#canvas"+index));

			$box.find('.inputtext').focus();
		});

	}

	/**
	 * class of imageBox
	 */
	var createImageBox = (function(){
		var imageId = 0; // image id

		return function(src,x,y){

			var img =document.createElement('img');
			img.id="img"+imageId;

			img.onload = function(){

				// image resizable
				$(img).attr('width', img.width+'px');
				$(img).attr('height', img.height+'px');
				$(img).resizable(); 

				// image located according current cursor position
				// cursor position is the center of a image
				$box.css({
					left : (x-img.width/2) + 'px',
					top : (y-img.height/2) + 'px'
				})
			}
			img.src= src;

			// imageBox templates
			var $box = $("<div id='imgBox"+imageId+"' style='position:absolute;' class='img-box'></div>");
			$box.append(img);
			$box.append(functionDiv);

			/**
			 * drag an image
			 */
			$box.draggable({
	            start: function() {
	                
	            }
	        });

			imageId++;

			return $box;
		}
	})()





	var createDrawObject = (function(){

		return function(id,shape){

			var x = shape.x;
			var y = shape.y;
			var w = shape.width;
			var h = shape.height;

			$box = $("<div class='draw-box setcenter' id='drawObject-"+index+"-"+id+"' style='position:absolute; top:"+(y-lineWidth/2)+"px;left:"+(x-lineWidth/2)+"px;'></div>");
			//var canvas = "<canvas class='setcenter canvas' id='canvas-"+index+"-"+id+"' ></canvas>"

			var tempcanvas = document.createElement('canvas');
			processingInstance = new Processing(tempcanvas, drawObj);

			function drawObj(processing){

				// trick for arrow and dash
				if(shape.type == "arrow" || shape.type == "dash"){
					
					var x1, y1, w1, h1;
					var xBox, yBox;

					if (w<0) { w1 = -w; x1 = -w; xBox = x+w-lineWidth*2; }
					else{ w1 = w; x1 = 0; xBox = x-lineWidth*2; }

					if (h<0) { h1 = -h; y1 = -h; yBox = y+h-lineWidth*2; }
					else{ h1 = h; y1 = 0; yBox = y-lineWidth*2; }
					$box.css("left",xBox).css("top",yBox);

					processing.size( w1+lineWidth*4, h1+lineWidth*4 ); // init processing size
					$(tempcanvas).css("width",w1+lineWidth*4).css("height",h1+lineWidth*4);
 				}
 				else{
					processing.size( w+lineWidth, h+lineWidth ); // init processing size
 					$(tempcanvas).css("width",w+lineWidth).css("height",h+lineWidth);
				}

 				

				setProcessingStyle(processing);

				switch(shape.type){
					case "rect":
						processing.rect(lineWidth/2,lineWidth/2, w, h);
						break;
					case "ellipse":
						processing.ellipse(lineWidth/2+w/2,lineWidth/2+h/2, w, h);
						break;
					case "arrow":
						drawArrow(x1+lineWidth*2,y1+lineWidth*2,w,h,processing);
						break;
					case "brush":
						drawBrush(shape.arrayX, shape.arrayY,processing);
						break;
					case "dash":
						drawDash(x1+lineWidth*2,y1+lineWidth*2,w,h,processing);
						break;
				}
				
			}

			$box.append(tempcanvas);
			$box.append(functionDiv);
			
			/**
			 * drag an image
			 */
			$box.draggable({
	            start: function() {
	                
	            }
	        });
			$(tempcanvas).resizable();

	        

	        return $box;
		}
	})()








	function drawDash(x,y,w,h,processing){

		setProcessingStyle(processing);

		var x1 = x;
		var y1 = y;

		var length = Math.sqrt((w)*(w) + (h)*(h));

		var units = length*1.0/(lineWidth*3);
		var dashSpaceRatio = 0.6;

		var divW = w/units*1.0;
		var divH = h/units*1.0;

		var dashW = divW*dashSpaceRatio;
		var dashH = divH*dashSpaceRatio;

		while (length > 0){

			processing.line(x1, y1, x1+dashW, y1+dashH);

			x1 += divW;
			y1 += divH;
			length -= lineWidth*3;
		}

	}

	function drawArrow(x,y,w,h,processing){
		setProcessingStyle(processing);

		processing.strokeCap(processing.ROUND);

		var Radius = 2*lineWidth;
		var endX = x+w;
		var endY = y+h;
		// line
		processing.strokeWeight(lineWidth);
		processing.line(x, y, endX, endY);

		// arrow
        var angle = Math.atan2(h,w)*(180/Math.PI);
       
        var centerX = endX-Radius * Math.cos(-angle *(Math.PI/180)) ;
        var centerY = endY+Radius * Math.sin(-angle *(Math.PI/180)) ;
        var topX = endX+Radius * Math.cos(-angle *(Math.PI/180));
        var topY = endY-Radius * Math.sin(-angle *(Math.PI/180));
        
        var leftX = centerX + Radius * Math.cos((-angle +120) *(Math.PI/180));
        var leftY = centerY - Radius * Math.sin((-angle +120) *(Math.PI/180));
        
        var rightX = centerX + Radius * Math.cos((-angle -120) *(Math.PI/180))  ;
        var rightY = centerY - Radius * Math.sin((-angle -120) *(Math.PI/180))  ;
 
                  
        processing.fill(220,220,220);
		processing.strokeWeight(1);

		processing.beginShape();
		processing.vertex(topX,topY);
		processing.vertex(leftX,leftY);
		processing.vertex(centerX,centerY);
		processing.vertex(rightX,rightY);
		processing.vertex(topX,topY);

		processing.endShape();

	}
	function drawBrush(arrayX,arrayY,processing){
		setProcessingStyle(processing);

		processing.beginShape();
		processing.curveVertex(arrayX[0],arrayY[0]);

		for(var i = 0; i<arrayX.length; i++)
			processing.curveVertex(arrayX[i],arrayY[i]);
		
		processing.curveVertex(arrayX[i-1],arrayY[1-1]);
		processing.endShape();
	}

	function setProcessingStyle(processing){

		processing.background(255,255,255,0);
		processing.stroke(220,220,220);
		processing.strokeWeight(lineWidth);
		processing.strokeCap(processing.SQUARE);
		processing.noFill();
		processing.noLoop();
	}

	function MyShape(t,x,y,w,h){

		this.type = t;
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
		this.arrayX = [];
		this.arrayY = [];
		this.maxX = 0;
		this.maxY = 0;
		this.minX = 100000;
		this.minY = 100000;
	}
	MyShape.prototype.init = function(t,x,y){
		this.type = t;
		this.x = x;
		this.y = y;
	};
	MyShape.prototype.reDisplay = function(){
		this.width = this.maxX - this.minX;
		this.height = this.maxY - this.minY;
		this.x = this.minX;
		this.y = this.minY; 

		for(var i = 0; i<this.arrayX.length; i++){
			this.arrayX[i] -= this.x - lineWidth/2;
			this.arrayY[i] -= this.y - lineWidth/2;
		}
	};
	MyShape.prototype.reDisplayBox = function(){
		if(this.width<0){
			this.x += this.width;
			this.width = -this.width;
		}
		if(this.height<0){
			this.y += this.height;
			this.height = -this.height;
		}

	}
	MyShape.prototype.setArray = function(x,y){
		var i = this.arrayX.length;
		this.arrayX[i] = x;
		this.arrayY[i] = y;

		if(x>this.maxX)
			this.maxX = x;
		if(x<this.minX)
			this.minX = x;
		if(y>this.maxY)
			this.maxY = y;
		if(y<this.minY)
			this.minY = y;
	};
	MyShape.prototype.setWH = function(x,y){
		this.width = x - this.x;
		this.height = y - this.y;
	};



	/**
	 * delete an object
	 */
	$('.do_click').live("click", function(){ 
		if($(this).parent().parent().hasClass("text-editor"))
			$(this).parent().parent().remove(); 
		else
			$(this).parent().parent().parent().remove(); 
	});	 
