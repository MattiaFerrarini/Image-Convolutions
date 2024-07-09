// Constants
const DEFAULT_KERNEL_VAL = 1; /* the default value for each kernel element */
const MAX_WIDTH = 768, MAX_HEIGHT = 512; /* max width and height [px] for the canvas */
/* colors representing kernel values */
const KERNEL_VAL_COLORS = ["blue", "purple", "blueviolet", "pink", "magenta", "lightskyblue",
    "black", "cyan", "green", "yellowgreen", "white", "yellow", "orange", "tomato", "red"];


// Variables for convolution computation
var kernel; /* the kernel matrix */
var kernelSize; /* the width and height of the kernel */
var originalMatrix; /* the matrix representing the original (uploaded) image */
var resultData; /* the ImageData object that will store the result of the convolution */

// Control variables
var selectedKernelVal; /* the numeric value selected for kernel creation */
var selectedKernelCol; /* the color associated to selectedKernelVal */
var currentImg; /* the image the user has uploaded, ie the currently used one */
var imgCanvas; /* the canvas where the images are drawn */
var showingOriginal = false; /* whether the canvas is displaying the unfilterd image or not */


/**
 * Applies a kernel/filter to a matrix and stores the result in resultData.
 * 
 * @param matrix the matrix.
 * @param kernel the kernel to apply.
 * @param resultData the ImageData object that will store the result of the convolution.
 */
function applyConvolution(matrix, kernel, resultData){
    const kernelHalf = Math.floor(kernelSize / 2);
    const height = matrix.length, width = matrix[0].length;

    console.log(width + "x" + height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = matrix[y][x][3];
            for (let ky = -kernelHalf; ky <= kernelHalf; ky++) {
                for (let kx = -kernelHalf; kx <= kernelHalf; kx++) {
                    // periodic boundaries condition
                    const py = (y + ky + height) % height;
                    const px = (x + kx + width) % width;

                    const pixel = matrix[py][px];
                    const weight = kernel[ky + kernelHalf][kx + kernelHalf];

                    r += pixel[0] * weight;
                    g += pixel[1] * weight;
                    b += pixel[2] * weight;
                }
            }

            // add computed pixel to resultData
            const index = (y * width + x) * 4;
            resultData.data[index] = clamp(r);
            resultData.data[index + 1] = clamp(g);
            resultData.data[index + 2] = clamp(b);
            resultData.data[index + 3] = a;
        }
    }

    console.log(resultData.data);
}

/**
 * Clamps a value to the valid range for RGB colors: [0, 255]
 * 
 * @param value the value to be clamped.
 * @returns the value clamped to the range [0, 255]
 */
function clamp(value){
    return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Sets up the buttons that allow the user to choose the kernel size, adding click-event handlers to them.
 */
function setUpKernelSizeButtons(){
    const filterSizeInputs = document.querySelectorAll('input[name="filterSize"]');
    filterSizeInputs.forEach(input => {
        input.addEventListener('click', function() {
            setUpKernel(this.value);
            console.log("Selected kernel size: " + this.value);
        });
    });
}

/**
 * Intializes both the internal representation of the kernel ('kernel' variable) and the 
 * external one (the matrix visible to the user).
 * It also sets of the divs of the matrix, adding click-event handlers to them.
 * 
 * @param kernelSize the desired size of the kernel. 
 */
function setUpKernel(kernelSize){
    window.kernelSize = kernelSize;

    const kernelDiv = document.getElementById("kernel");
    kernelDiv.innerHTML = "";
    kernelDiv.style.gridTemplateColumns = `repeat(${kernelSize}, 1fr)`;

    kernel = [];
    for(let i = 0; i < kernelSize; i++){
        let row = [];
        for(let j = 0; j < kernelSize; j++){
            row.push(DEFAULT_KERNEL_VAL);

            const childDiv = document.createElement('div');
            childDiv.classList.add("kernelItem");
            childDiv.addEventListener("click", modifyKernel);
            childDiv.addEventListener("mouseenter", function(event) {
                if (event.buttons === 1) {
                    modifyKernel(event);
                }
            });
            kernelDiv.appendChild(childDiv);
        }
        kernel.push(row);
    }
}

/**
 * Sets up the buttons that allow the user to select one of the possible values for the kernel elements.
 * It adds click-event listeners, which update the selected value and color 
 * (variables 'selectedKernelVal' and 'selectedKernelCol').
 */
function setUpKernelValButtons(){
    const resetButton = document.getElementById("kernelResetButton");
    resetButton.addEventListener("click", resetKernel);

    const valButtons = document.querySelectorAll('.kernelValue');
    valButtons.forEach((input, index) => {
        // set up color for this button
        input.querySelector(".kernelColor").style.backgroundColor = KERNEL_VAL_COLORS[index];

        // add click-event listener
        input.addEventListener('click', function() {
            valButtons.forEach(function(button) {
                button.classList.remove('selectedVal');
            });
            this.classList.add("selectedVal");
            selectedKernelCol = window.getComputedStyle(this.querySelector(".kernelColor")).backgroundColor;
            selectedKernelVal = parseFloat(this.querySelector("p").textContent);

            console.log("Selected color: " + selectedKernelCol);
            console.log("Selected value: " + selectedKernelVal);
        });
    });
}

/**
 * Updates the result data and displays it if necessary. 
 * The function should be called every time the kernel and/or original image change.
 */
function updateResultData(){
    if(resultData){
        applyConvolution(originalMatrix, kernel, resultData);

        if(!showingOriginal)
            drawResult();
    }
}

/**
 * Handles a click on any of the cells of the kernel matrix, 
 * modifying the kernel and the matrix according to the clicked element and the previously selected value.
 * 
 * @param event the event representing the click.
 */
function modifyKernel(event){
    // find the div associated to the event
    const clickedDiv = event.target;
    const index = Array.from(clickedDiv.parentNode.children).indexOf(clickedDiv);
    const row = Math.floor(index / kernelSize);
    const col = index % kernelSize;

    // update the color of the clicked div and the kernel
    clickedDiv.style.backgroundColor = selectedKernelCol;
    kernel[row][col] = selectedKernelVal;

    console.log("Kernel: " + kernel);

    // update the result
    updateResultData();
}

/**
 * Resets the kernel to have all elements equal to the default value.
 */
function resetKernel(){
    for(let i = 0; i < kernelSize; i++){
        for(let j = 0; j < kernelSize; j++){
            kernel[i][j] = DEFAULT_KERNEL_VAL;
        }
    }
    const kernelDivs = document.querySelectorAll(".kernelItem");
    kernelDivs.forEach(function(div) {
        div.style.backgroundColor = "white";
    });

    console.log("Kernel reset");

    updateResultData();
}

/**
 * It draws the result on the canvas, effectively displaying it.
 */
function drawResult(){
    const context = imgCanvas.getContext('2d');
    context.putImageData(resultData, 0, 0);
}

/**
 * It draws an image on a canvas. It resizes the image to match the canvas max allowed size.
 * 
 * @param img the image to draw. 
 * @param canvas the canvas to draw the image on.
 */
function drawImageOnCanvas(img, canvas){

    let width = img.width;
    let height = img.height;

    if (width > height) {
        if (width > MAX_WIDTH) {
            height = Math.round((MAX_WIDTH / width) * height);
            width = MAX_WIDTH;
        }
    }
    else {
        if (height > MAX_HEIGHT) {
            width = Math.round((MAX_HEIGHT / height) * width);
            height = MAX_HEIGHT;
        }
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, width, height);
}

/**
 * It saves the matrix representation of the image drawn in 'canvas' in
 * the global variable 'originalMatrix'.
 * 
 * @param canvas the canvas where the image is drawn. 
 */
function saveImgAsMatrix(canvas){
    const context = canvas.getContext('2d');
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;

    const width = canvas.width, height = canvas.height;

    window.originalMatrix = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];
            row.push([r, g, b, a]);
        }
        window.originalMatrix.push(row);
    }

    console.log(originalMatrix);
}

/**
 * It creates an ImageData object for the result of the convolution between the image and the kernel (filter).
 * 
 * @param matrix the matrix representation of an image, used to initialize the result.
 * @param canvas the canvas where the result should be drawn.
 */
function createResultData(matrix, canvas){
    const context = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;

    resultData = context.createImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const [r, g, b, a] = matrix[y][x];
            resultData.data[index] = r;
            resultData.data[index + 1] = g;
            resultData.data[index + 2] = b;
            resultData.data[index + 3] = a;
        }
    }
}

/**
 * Handles the uploading of an image. Firstly, it displays the image and saves its matrix representation.
 * Then, it creates an ImageData object for the result of the convolution between the image and the kernel (filter).
 * Finally, it computes the convolution.
 * 
 * @param event the event to handle. 
 */
function handleImageUpload(event){
    const file = event.target.files[0];

    if (file && file.type.startsWith("image/")) {
        currentImg = new Image();
        const reader = new FileReader();

        reader.onload = function(e) {
            currentImg.onload = function() {
                switchToOriginal(); // display the newly uploaded image
                saveImgAsMatrix(imgCanvas); // save the matrix representation of the image
                createResultData(originalMatrix, imgCanvas); // create an ImageData object for the filtered version
                applyConvolution(originalMatrix, kernel, resultData); // calculates the convolution between the image and the kernel
            };
            currentImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } 
    else {
        alert('Please upload a valid image file.');
    }
}

/**
 * Sets up a change-event listener for the image input field.
 */
function setUpFileUpload(){
    document.getElementById("imageUpload").addEventListener("change", handleImageUpload);
}

/**
 * Switches to the original image.
 */
function switchToOriginal(){
    if(currentImg){
        const switchButton = document.getElementById("imgControlButton");
        drawImageOnCanvas(currentImg, imgCanvas);
        switchButton.textContent = "Show result";
        showingOriginal = true;
    }
}

/**
 * Switches to filtered image, ie the result of the convolution.
 */
function switchToResult(){
    if(resultData){
        const switchButton = document.getElementById("imgControlButton");
        drawResult();
        switchButton.textContent = "Show original";
        showingOriginal = false;
    }
}

/**
 * Sets up the button that allows to switch from the original image to the filtered one.
 */
function setUpSwitchButton(){
    document.getElementById("imgControlButton").addEventListener("click", function(){
        if(showingOriginal)
            switchToResult();
        else
            switchToOriginal();
    });
}

/**
 * Displays the kernel.
 */
function displayKernel(){
    // get the value-color mappings
    const mappings = {};
    const kernelValues = document.querySelectorAll('.kernelValue');

    kernelValues.forEach(kernelValue => {
        const key = kernelValue.querySelector('p').textContent;
        const value = window.getComputedStyle(kernelValue.querySelector('.kernelColor')).backgroundColor;
        mappings[key] = value;
    });

    // color the divs of the kernel
    const kernelDivs = document.querySelectorAll(".kernelItem");
    for(let y = 0; y < kernel.length; y++){
        for(let x = 0; x < kernel[0].length; x++)
            kernelDivs[y * kernel.length + x].style.backgroundColor = mappings[kernel[y][x]];
    }
}

/**
 * 
 * Sets the kernel to be one of the default filters.
 * 
 * @param filterIndex the index of the selected filter.
 */
function applyFilter(filterIndex){

    // all filters have a size of 3
    setUpKernel(3);

    // find the correct filter
    switch(filterIndex){
        case 0:
            kernel = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]; break;
        case 1:
            kernel = [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]; break;
        case 2:
            kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]; break;
        case 3:
            kernel = [[0.1, 0.1, 0.1], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1]]; break;
        case 4:
            kernel = [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]]; break;
        case 5:
            kernel = [[2, 1, 0], [1, -1, -1], [0, -1, -2]]; break;
        case 6:
            kernel = [[0, 1, 0], [1, -4, 1], [0, 1, 0]]; break;
        case 7:
            kernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]; break;
        case 8:
            kernel = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]; break;
        default:
            kernel = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]; break;
    }

    // display the new kernel and update the image result
    displayKernel();
    updateResultData();

    console.log("Selected filter: " + filterIndex);
    console.log("Selected kernel: " + kernel);
}

/**
 * Sets up click-event listeners for each 'Apply' button associated with the default filters.
 */
function setUpDefaultFilterButtons(){
    const buttons = Array.from(document.getElementById("kernelExampleList").children);
    buttons.forEach((b, index) => {
        b.addEventListener("click", (function(i){
            return function(){
                applyFilter(i);
            }
        })(index));
    });
}

/**
 * Gets the default values for the selections in the 'Settings' panel.
 */
function getDefaultVals(){
    kernelSize = document.querySelector('input[name="filterSize"]:checked').value;

    const defaultKernelValButton = document.querySelector(".selectedVal");
    selectedKernelCol = window.getComputedStyle(defaultKernelValButton.querySelector(".kernelColor")).backgroundColor;
    selectedKernelVal = parseFloat(defaultKernelValButton.querySelector("p").textContent);
}

/**
 * Setups the website.
 */
function setUp(){
    getDefaultVals();
    imgCanvas = document.getElementById("imgCanvas");

    setUpKernelSizeButtons();
    setUpKernelValButtons();
    setUpKernel(kernelSize);

    setUpFileUpload();
    setUpSwitchButton();

    setUpDefaultFilterButtons();
}

window.onload = setUp;