//top buttons:
//new box:
function newBox(){
    createdBox = new Box(500, 250, 50, 50);
    createdBox.select();
}
//remove the selected box
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
function clearCanvas(){
    if (window.confirm("Clear all boxes from this canvas?")){
        while(zList.length>0){
            zList[0].select();
            removeBox();
        }
    }
}




let grabbedObj= null;
let selectedBox = null;
let zList = [];

function grab(event){
    grabbedObj = getObj(event.target);
    //select the grabbed object
    grabbedObj.select();
    if (grabbedObj.shadow != null){
        grabbedObj.shadow.setAttribute("visibility", "visible");
    }
}

function unGrab(event){
    if (grabbedObj != null && grabbedObj.shadow != null){
        grabbedObj.shadow.setAttribute("visibility", "hidden");
    }
    grabbedObj = null;
}

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



function getMouseCoords(event){
    let CTM = event.target.getScreenCTM();
    return [(event.clientX - CTM.e)/CTM.a, (event.clientY - CTM.f)/CTM.d];
}

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

function keyPressed(event){
    if (event.key === "Backspace"){
        removeBox();
    }
}




class Box{
    //create a new box given location of the top left corner, height, width
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
    //action for when the box is selected
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
    //action for when the box is unselected
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
    //update the position all relevant svgs
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

    updateZIndex(zIndex){
        this.zIndex = zIndex;
        this.svg.setAttribute("zIndex", zIndex);
        for (let node of this.nodes){
            node.svg.setAttribute("zIndex", zIndex);
        }
    }
}

class Node{
    //construct a new node using
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
    updatePos(x, y){
        this.x = x;
        this.y = y;
        this.svg.setAttribute("cx", x);
        this.svg.setAttribute("cy", y);
    }

    select(){
        this.belongedBox.select();
    }
}
