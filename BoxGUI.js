//top buttons:

/**
 * Creates and selects a new 50x50px box at (500,250).
 */
function newBox(){
    createdBox = new Box(500, 250, 50, 50);
    createdBox.select();
}
/**
 * If a box is selected, removes it.
 */
function removeBox(){
    //if there is no box selected
    if (selectedBox==null){
        return;
    }
    
    //remove from the zList
    for (let i = selectedBox.zIndex; i < zList.length - 1; i++){
        zList[i]=zList[i+1]; //shift each element over to the left
        zList[i].updateZIndex(i); //change the element's zIndex to match its real index
    } //stop right before last element, then remove last element
    zList.pop();

    //remove the element from the html
    selectedBox.svg.remove();
    selectedBox.shadow.remove();
    for (let node of selectedBox.nodes){
        node.svg.remove();
    }
    //unselect the box
    selectedBox.unSelect();
}
/**
 * If a box is selected, duplicates it and selects the new box.
 */
function dupeBox(){
    //if there is no box selected
    if (selectedBox==null){
        return;
    }

    //create new box
    boxCopy = new Box(selectedBox.x+(selectedBox.width/2)+10, selectedBox.y+(selectedBox.height/2)+10, selectedBox.width, selectedBox.height);
    //select new box
    boxCopy.select();
}
/**
 * Clears all boxes off of the canvas.
 */
function clearCanvas(){
    if (window.confirm("Clear all boxes from this canvas?")){
        while(zList.length>0){
            zList[0].select();
            removeBox();
        }
    }
}



/** The object that is currently grabbed and being dragged */
let grabbedObj= null;
/** The box that is currently selected */
let selectedBox = null;
/** The list of all elements ordered by order of creation */
let zList = [];

/**
 * Grabs the object that is currently being clicked.
 * @param {MouseEvent} event data about the event used to trigger grab()
 */
function grab(event){
    grabbedObj = getObj(event.target);
    //select the grabbed object
    grabbedObj.select();
    if (grabbedObj.shadow != null){
        grabbedObj.shadow.setAttribute("visibility", "visible");
    }
}

/**
 * Lets go of the object that is currently being grabbed.
 * @param {MouseEvent} event data about the event used to trigger unGrab()
 */
function unGrab(event){
    if (grabbedObj != null && grabbedObj.shadow != null){
        grabbedObj.shadow.setAttribute("visibility", "hidden");
    }
    grabbedObj = null;
}

/**
 * If an object is currently being grabbed, drags it to follow the cursor.
 * @param {MouseEvent} event data about the mouse movements
 */
function dragObj(event){
    if (grabbedObj == null){
        return
    }

    //get the mouse x and y
    let x = getMouseCoords(event)[0];
    let y = getMouseCoords(event)[1];

    //update the position of the grabbed object
    grabbedObj.drag(x,y);
}

/**
 * Gets the mouse x, y relative to the svg canvas.
 * @param {MouseEvent} event the event that contains the x and y information necessary to get the mouse coords
 * @returns {Array} array containing the x and y coordinates of the mouse [x,y].
 */
function getMouseCoords(event){
    let CTM = event.target.getScreenCTM();
    return [(event.clientX - CTM.e)/CTM.a, (event.clientY - CTM.f)/CTM.d];
}

/**
 * Gets the object that corresponds to the element that is the parameter.
 * @param {Element} element The element linked to an object.
 * @returns {Object} The box or node that corresponds to the element.
 */
function getObj(element){
    let obj = null;
    if(element.getAttribute("zIndex") != null){ //if the zIndex exists
        //set the object to be the object with that zIndex
        obj = zList[Number(element.getAttribute("zIndex"))];
        if(element.getAttribute("nodeIndex") != null){//if the nodeIndex exists
            //set the grabbed object to be the node with that nodeIndex
            obj = obj.nodes[Number(element.getAttribute("nodeIndex"))];  
        }
    }
    return obj;
}

/**
 * Performs actions based on key presses
 * @param {KeyboardEvent} event the event that triggered this function.
 */
function keyPressed(event){
    if (event.key === "Backspace"){
        removeBox();
    }
}



/**
 * Box object, manages a box on the screen.
 */
class Box{

    /**
     * Create a new box with shadows and nodes
     * @param {Number} x initial x position of the box center
     * @param {Number} y initial y position of the box center
     * @param {Number} width initial width of the box
     * @param {Number} height initial height of the box
     */
    constructor(x,y,width,height){
        this.zIndex = zList.length;

        //create the drop shadow, hide it, store in this.shadow
        this.shadow = document.createElementNS("http://www.w3.org/2000/svg",'rect');
        this.shadow.setAttribute("fill-opacity", "0.25"); //drop shadow opacity
        this.shadow.setAttribute("visibility","hidden");
        document.getElementById("svgCanvas").appendChild(this.shadow);

        //create the box svg, store in this.svg
        this.svg = document.createElementNS("http://www.w3.org/2000/svg",'rect');
        this.svg.setAttribute("onmousedown", "grab(event)"); //add event allowing it to be grabbed
        this.svg.setAttribute("zIndex", zList.length); //add an index to the svg
        this.svg.setAttribute("stroke-width", 3);
        zList.push(this);
        document.getElementById("svgCanvas").appendChild(this.svg);

        this.svg.style.cursor="move";

        //create the corner and side nodes, stores in this.nodes
        this.nodes=[];
        this.nodes.push(new Node(this.x+this.width, this.y+this.height, 0, this));//bottom right node
        this.nodes.push(new Node(this.x+this.width/2, this.y+this.height, 1, this));//bottom node
        this.nodes.push(new Node(this.x+this.width, this.y+this.height/2, 2, this));//right node

        this.updateSize(width, height);
        this.drag(x, y);
    }

    /**
     * Selects the box
     */
    select(){
        //unselect old box
        if (selectedBox != null){
            selectedBox.unSelect();
        }
        //change border
        this.svg.setAttribute("stroke-dasharray", "5");
        this.svg.setAttribute("stroke", "DodgerBlue");
        //show nodes
        for(let node of this.nodes){
            node.svg.setAttribute("visibility", "visible");
        }
        //change selectedBox
        selectedBox = this;
    }
    /**
     * Unselects the box
     */
    unSelect(){
        //hide border
        this.svg.removeAttribute("stroke-dasharray");
        this.svg.setAttribute("stroke", "black");
        //hide nodes
        for(let node of this.nodes){
            node.svg.setAttribute("visibility", "hidden");
        }
        //update selectedBox
        selectedBox = null;
    }
    /**
     * Moves the box so the center is at (x,y) according to parameters
     * @param {Number} x x position of the center
     * @param {Number} y y position of the center
     */
    drag(x, y){
        //update fields
        this.x = x-(this.width/2);
        this.y = y-(this.height/2);

        //update svg position
        this.svg.setAttribute("x", this.x);
        this.svg.setAttribute("y", this.y);

        //update shadow position
        this.shadow.setAttribute("x", this.x + 20);
        this.shadow.setAttribute("y", this.y + 20);

        //update node positions
        this.nodes[0].updatePos(this.x+this.width, this.y+this.height);
        this.nodes[1].updatePos(this.x+this.width/2, this.y+this.height);
        this.nodes[2].updatePos(this.x+this.width, this.y+this.height/2);
    }
    /**
     * Updates the width and height of the box
     * @param {Number} width width of the box
     * @param {Number} height height of the box
     */
    updateSize(width, height){
        //update fields
        this.height = height;
        this.width = width;

        //update box size
        this.svg.setAttribute("height", height);
        this.svg.setAttribute("width", width);
        //update shadow size
        this.shadow.setAttribute("height", height);
        this.shadow.setAttribute("width", width);
        //update node positions
        this.nodes[0].updatePos(this.x+this.width, this.y+this.height);
        this.nodes[1].updatePos(this.x+this.width/2, this.y+this.height);
        this.nodes[2].updatePos(this.x+this.width, this.y+this.height/2);
    }

    /**
     * Updates the z Index of the box and corresponding nodes
     * @param {Number} zIndex new zIndex of the box
     */
    updateZIndex(zIndex){
        this.zIndex = zIndex;
        this.svg.setAttribute("zIndex", zIndex);
        for (let node of this.nodes){
            node.svg.setAttribute("zIndex", zIndex);
        }
    }
}

/**
 * Node object, manages a node on the screen. Nodes belong to objects like Boxes and Arrows.
 */
class Node{
    /**
     * Create and hide a new node
     * @param {Number} x initial x position of the node
     * @param {Number} y initial y position of the node
     * @param {Number} nodeIndex index of the node within its superior object
     * @param {Number} belongedBox superior object of the node
     */
    constructor(x, y, nodeIndex, belongedBox){

        this.belongedBox = belongedBox;
        this.nodeIndex = nodeIndex;

        this.svg = document.createElementNS("http://www.w3.org/2000/svg",'circle');
        this.svg.setAttribute("fill", "DodgerBlue");
        this.svg.setAttribute("r", 5);
        this.svg.setAttribute("onmousedown", "grab(event)");
        this.svg.setAttribute("visibility", "hidden");
        this.updatePos(x, y);
        this.svg.setAttribute("zIndex", this.belongedBox.zIndex);
        this.svg.setAttribute("nodeIndex", nodeIndex);
        document.getElementById("svgCanvas").appendChild(this.svg);

        if (nodeIndex==0){
            this.svg.style.cursor="nw-resize";
        } else if (nodeIndex==1){
            this.svg.style.cursor="ns-resize";
        } else if (nodeIndex==2){
            this.svg.style.cursor="ew-resize";
        }
    }

    /**
     * Drags a node based on mouse x and y, and adjusts superior object accordingly.
     * @param {Number} x x position of mouse dragging the node
     * @param {Number} y y position of mouse dragging the node
     */
    drag(x,y){
        let newWidth = this.belongedBox.width;
        let newHeight = this.belongedBox.height;
        if ((this.nodeIndex == 1 || this.nodeIndex == 0) && y > this.belongedBox.y+10){ //if the bottom node or the bottom right node
            newHeight = y - this.belongedBox.y;
        }
        if ((this.nodeIndex == 2 || this.nodeIndex == 0) && x > this.belongedBox.x+10){ //if the right node or the bottom right node
            newWidth = x - this.belongedBox.x;
        }
        this.belongedBox.updateSize(newWidth, newHeight);
    }
    /**
     * Updates the x and y of the node.
     * @param {Number} x the new x position of the node
     * @param {Number} y the new y position of the node
     */
    updatePos(x, y){
        this.x = x;
        this.y = y;
        this.svg.setAttribute("cx", x);
        this.svg.setAttribute("cy", y);
    }
    /**
     * Selects the superior object that the node belongs to.
     */
    select(){
        this.belongedBox.select();
    }
}
