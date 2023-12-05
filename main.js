const canvas = document.getElementById("Canvas")
const context = canvas.getContext('2d');

//graphics - 40x40 per square with 2px seperators
//note - board is 10x20 squares

const squareWidth = 40
const sepWidth = 2

let movementBuffer = ""

let score = 0 // need to look at documentation to copy the scoring system :P
let level = 0 // this determines fall speed and increment every 10 clears 
let lineClears = 0

window.addEventListener("keydown", (e)=>{movementBuffer = e.key; document.getElementById("currKey").innerHTML=movementBuffer})
window.addEventListener("keyup", (e)=>{movementBuffer = e.key == movementBuffer? "": movementBuffer; document.getElementById("currKey").innerHTML=movementBuffer})

let board = ["1111110011"]  // 20 rows with 10 columns each with a 1 or 0 to represent if there is a filled block there

for(i=0;i<16;i++){
    board.push("0000000000")
}
board.push("1111111111")

let currMino = null

const LBlock = [
    "1",
    "1",
    "1",
    "1"
]

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
    return this.slice(0,idx) + value + this.slice(idx)
}

class tetromino{
    constructor(x, shape, colour, y=20, pointOfRotation){
        this.x=x
        this.y=y
        let rawshape = shape //will look like [0000,0000,0000,0000] where each entry is a row and each bit indicated whether there is a block there
        this.shape = this.parseShape(rawshape)
        this.colour = colour
        this.inplay = true
        this.pointOfRotation = pointOfRotation
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
    drawSquare(square){
        let aligned = alignGrid(square)
        context.fillStyle=this.colour;
        
        context.fillRect(aligned[0], aligned[1], squareWidth,squareWidth);
            
    }
    checkCollisionDownSquare(square){

        if(board[square[1]+1][square[0]] === "1" || square[1]>=19){ // check if the gridspace below it is filled
            //if so then add this to the board
            print("collided")
            this.solidify()
            this.inplay = false
            
        }
        
    }
    moveShapeDown(){
        if(!this.inplay){
            return
        }
        this.y += 1
        for(let i=0;i<this.shape.length;i++){
            let square = sumArrs(this.shape[i], [this.x,this.y])
            this.checkCollisionDownSquare(square)
            
        }
    }
    parseInput(){
        if(!this.inplay){
            return
        }
        switch(movementBuffer){
            case "d":
                this.x += 1
                break
            case "a":
                this.x -=1
                break
            case "s":  // soft drop
                this.y += 1
                break
            case "ArrowRight":
                //todo rotations
                break
            case "ArrowLeft":
                break
            case " ":  // hard drop
                this.hardDrop()
                break
        }
    }
    hardDrop(){
        while(this.inplay){
            this.update()
        }
    }
    update(){
        this.computeShapeActions()
        this.parseInput()
    }
    solidify(){
        for(let i=0;i<this.shape.length;i++){
            let square = sumArrs(this.shape[i], [this.x,this.y])

            board[square[1]] = board[square[1]].replaceAt(square[0], "1")
            this.inplay = false
            
        }
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

function run(){
    drawGrid()

    currMino = new tetromino(5,LBlock,"blue",6)


    //updateBoard()

    setInterval(() => {
        updateBoard()
    },1000/60);
    setInterval(()=>{currMino.moveShapeDown()},500)

}
