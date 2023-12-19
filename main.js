const canvas = document.getElementById("Canvas")
const context = canvas.getContext('2d');

//note: minos are defined in a seperate file

//graphics - 40x40 per square with 2px seperators
//note - board is 10x20 squares

const squareWidth = 40
const sepWidth = 2

let feedbackBuffer = false

const feedbackSlider = document.getElementById("feedback")
feedbackSlider.setAttribute("step", 1000/60)
feedbackSlider.addEventListener("mousemove", ()=>{feedbackDelay = feedbackSlider.value})

let feedbackDelay = feedbackSlider.value

let movementBuffer = {}

let score = 0 // need to look at documentation to copy the scoring system :P
let level = 0 // this determines fall speed and increment every 10 clears
let lineClears = 0

window.addEventListener("keydown", (e)=>{movementBuffer[e.key] = true; document.getElementById("currKey").innerHTML=feedbackBuffer})
window.addEventListener("keyup", (e)=>{movementBuffer[e.key] = false; /*print(movementBuffer)*/})

let board = []  // 20 rows with 10 columns each with a 1 or 0 to represent if there is a filled block there

for(i=0;i<20;i++){
    board.push("0000000000")
}
//board.push("1111111111")

let currMino = null

const screenWidth = 10*squareWidth + 9*sepWidth
const screenHeight = 20*squareWidth + 19*sepWidth

window.addEventListener("load",()=>{canvas.width = screenWidth;canvas.height = screenHeight;run()})

function drawGrid(){
    for(let i=1;i<10;i++){
            context.strokeStyle='black';
            context.lineWidth=sepWidth;
       
       
            context.beginPath();

            context.moveTo((sepWidth+squareWidth)*i,0)
            context.lineTo((sepWidth+squareWidth)*i, screenHeight);
           
            context.stroke();
    }
    for(let i=1;i<20;i++){
        context.strokeStyle='black';
        context.lineWidth=sepWidth;
   
   
        context.beginPath();

        context.moveTo(0,(sepWidth+squareWidth)*i);
        context.lineTo(screenWidth,(sepWidth+squareWidth)*i);
       
        context.stroke();
    }
}

function alignGrid(coordPair){ // expects [x,y]
    return [1+coordPair[0]*squareWidth+(coordPair[0]*sepWidth),1+coordPair[1]*squareWidth+(coordPair[1]*sepWidth)]
}

function sumArrs(a1,a2){ // assumes theyre the same size
    let result = []
    for(let i=0;i<a1.length;i++){
        result.push(a1[i] + a2[i])
    }
    return result
}

String.prototype.replaceAt = function (idx, value){
    if(idx > this.length){
        throw Error("Index out of range")
    }
    if(typeof(idx) != "number" || typeof(value) != "string"){
        throw Error("Incorrect data type")
    }
    if(!Number.isInteger(idx)){
        throw Error("Not an integer")
    }
    return this.slice(0,idx) + value + this.slice(idx+1)
}

class tetromino{
    constructor(x, shape, colour, y=20){
        this.x=x
        this.y=y
        let rawshape = shape //will look like [0000,0000,0000,0000] where each entry is a row and each bit indicated whether there is a block there
        this.shapeSize = Math.max(rawshape.length,rawshape[0].length)
        this.shape = this.parseShape(rawshape)
        this.colour = colour
        this.inplay = true
        this.pointOfRotation = shape.slice(-1)[0]
        this.invPointOfRotation = [-this.pointOfRotation[0], -this.pointOfRotation[1]]
        setInterval(()=>{this.parseInput()}, feedbackDelay)
        
        for(let i=0;i<board.length;i++){
            if(board[i] == "1111111111"){
                board.splice(i,1)
                board.unshift("0000000000")
            }
        }
    }
    parseShape(rawshape){
        let temp = []
        for(let i=0;i<rawshape.length;i++){ // for each row in the raw shape
            let row = rawshape[i]
            for(let j=0;j<row.length;j++){
                if(row[j] === "1"){
                    temp.push([j,i])
                }
            }
        }
        return temp
    }


    // given focal point in middle?
    //   000   (0,0)->(0,0)         0000  (0.5,-0.5)->(0.5,0.5)
    //   010   (-1,1)->(-1,-1)      1111  (1.5,-0.5)->(0.5,1.5)  
    //   111   (0,1)->(-1,0)        0110  (1.5,1.5)->(-1.5,1.5)
    //    V    (1,1)->(-1,1)        1111  (1,2)->(,)
    //   100                          V   (1,3)->(,)
    //   110                        1010  (2,1)->(,)
    //   100                        1110  (2,2)->(,)
    //                              1110
    //                              1010

    rotateShape(clockwise){
        let currShape = this.shape
        let tempRaw = []
        for(let i=0;i<this.shapeSize;i++){
            tempRaw.push((new Array(this.shapeSize+1).join("0")))  // the joined array will make a string of length of shapesize and fill it with 0s
        }
        for(let i=0; i<currShape.length;i++){
            let focalPoint = (this.shapeSize - 1)/2  // this can be used for both x and y since its symetric
            let block = sumArrs(currShape[i], [-focalPoint,-focalPoint])
            
            currShape[i] = sumArrs([-block[1], block[0]],[focalPoint,focalPoint])
            tempRaw[currShape[i][1]] = tempRaw[currShape[i][1]].replaceAt(currShape[i][0],"1")
        }
        this.shape = currShape
       
    }

    drawSquare(square){
        let aligned = alignGrid(square)
        context.fillStyle=this.colour;
       
        context.fillRect(aligned[0], aligned[1], squareWidth,squareWidth);
       
    }
    checkCollisionDownSquare(square){
       
        if( square[1]>=19){ // check if the gridspace below it is filled
            //if so then add this to the board
            //print(this.shape)
   
            this.solidify()
            this.inplay = false
            return
        }
       
        if(board[square[1]+1][square[0]] === "1"){
           
            //if so then add this to the board
            //print(this.shape)
   
            this.solidify()
            this.inplay = false
            return
        }
    }
    moveShapeDown(){
        if(!this.inplay){
            return
        }
        for(let i=0;i<this.shape.length;i++){
            let square = sumArrs(this.shape[i], [this.x,this.y])
            this.checkCollisionDownSquare(square)
           
        }
        this.y += 1
    }
    checkCollisionSide(){
        for(let i=0;i<this.shape.length;i++){
            let squarex = this.x + this.shape[i][0]+1
            let squarey = this.shape[i][1]+this.y
           
            if(squarex >= 10){
                return 1
            }
            if(squarex <= 1){
                return -1
            }
            if(board[squarey][squarex-2] === "1"){
                return -1
            }
            if(board[squarey][squarex+1] === "1"){
                return 1
            }
           
        }
        return 0

    }

    parseInput(){
        if (movementBuffer["ArrowRight"]){ // TODO: rotation system
            this.rotateShape(false)
        }
        if (movementBuffer["ArrowLeft"]){
            this.rotateShape(true)
        }
        if(movementBuffer["d"]){
            if(this.checkCollisionSide() !== 1){
                this.x += 1
            }
        }
        if (movementBuffer["a"]){
           
            if(this.checkCollisionSide() !== -1){
                this.x -= 1
            }
           
        }
        if (movementBuffer["s"]){
            this.moveShapeDown()
           
        }
        if (movementBuffer[" "]){
            this.hardDrop()
        }

    }
    hardDrop(){
        while(this.inplay){
            this.moveShapeDown()
        }
    }
    update(){
        this.computeShapeActions()
    }
    solidify(){
        for(let i=0;i<this.shape.length;i++){
            let square = sumArrs(this.shape[i], [this.x,this.y])
           
            board[square[1]] = board[square[1]].replaceAt(square[0], "1")
            drawCollided()  
           
            //board.forEach((x)=>{print(x)})
            //print("===============")
        }
        if(this.inplay){
            currMino = createShape()
        }
        this.inplay = false
    }
    computeShapeActions(){
        for(let i=0;i<this.shape.length;i++){
            let square = sumArrs(this.shape[i], [this.x,this.y])
           
            this.drawSquare(square)
           
        }
    }
}
   
    function updateBoard(){
        context.clearRect(0, 0, screenWidth, screenHeight);
        drawGrid()
        context.fillStyle = "#aaaaaa"
        for(let i=0;i<board.length;i++){
            for(let j=0;j<board[i].length;j++){
                if(board[i][j] === "1"){
                    //print(i>= 15?"yes":"")
                let drawCoords = alignGrid([j,i])
                context.fillRect(drawCoords[0],drawCoords[1],squareWidth,squareWidth);
               
            }
        }
    }
    (()=>{currMino.update()})()
}

function drawCollided(){
    context.fillStyle='#aaa';
   
    for(let i=0;i<board.length;i++){
        for(let j=0;j<board[i].length;j++){
            if(board[i][j] === "1"){
                //print(i>= 15?"yes":"")
                let drawCoords = alignGrid([j,i])
                context.fillRect(drawCoords[0],drawCoords[1],squareWidth,squareWidth);
               
            }
        }
    }
}

function createShape(){
    shapeIdx = Math.floor(Math.random()*tetrominos.length)  //gets a random number within the suitable range for an index
    return new tetromino(5, tetrominos[shapeIdx], "blue", 0)
}

function run(){
    drawGrid()

    currMino = createShape()


    //updateBoard()

    setInterval(() => {
        updateBoard()
    },1000/60);
    setInterval(()=>{currMino.moveShapeDown()},500)

}