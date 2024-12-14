document.addEventListener("DOMContentLoaded", function () {
    let display = document.getElementById("calc-display");
    let resultDisplay = document.getElementById("calc-result");
    let buttons = document.querySelectorAll(".calc-btn");
    let historyModal = document.getElementById("history-modal");
    let historyContent = document.getElementById("history-content");
    let clearHistoryButton = document.getElementById("clear-history");
    let clearInputButton = document.getElementById("clear-input");
    let closeHistoryButton = document.querySelector(".close-button");
    let currentCalculation = "";
    let historyEntries = {};

   // Automatically focus the input field on page load
   resultDisplay.focus();

   // Ensure the input stays focused even after user clicks other elements
   resultDisplay.addEventListener("blur", () => resultDisplay.focus());

// Handle input from the keyboard in the resultDisplay input field
resultDisplay.addEventListener("input", function (e) {
    const inputValue = this.value.trim();

    // Allow only valid mathematical characters
    if (/^[\d+\-*/.()]*$/.test(inputValue)) {
        // Check what the user typed
        const lastChar = inputValue.slice(-1); // Last character entered
        const prevCalculation = currentCalculation; // Store the previous state

        // If the input length increased, append the new character
        if (inputValue.length > prevCalculation.length) {
            currentCalculation += lastChar;
        } else if (inputValue.length < prevCalculation.length) {
            // If the input length decreased, assume a backspace
            currentCalculation = currentCalculation.slice(0, -1);
        }

        // Update the display
        display.innerText = formatDisplay(currentCalculation);
        updateResult(); // Dynamically calculate the result
    } else {
        // Revert to the last valid state if invalid input
        this.value = currentCalculation;
    }
});

// Allow backspace, numbers, and operators
document.addEventListener("keydown", function (e) {
    const key = e.key;
    const isNumber = /\d/.test(key); // Check if the key is a digit
    const isOperator = ["+", "-", "*", "/"].includes(key); // Check if it's an operator
    const allowedKeys = ["Backspace", "Enter", "=", "."]; // Special allowed keys

    if (isNumber || isOperator || allowedKeys.includes(key)) {
        e.preventDefault(); // Prevent default browser actions for these keys

        if (isNumber || isOperator || key === ".") {
            handleInput(key); // Process valid input
        } else if (key === "Backspace") {
            handleDelete(); // Handle deletion
        } else if (key === "Enter" || key === "=") {
            handleEquals(); // Calculate the result
        }
    }
});

// Ensure the result is updated correctly on paste
resultDisplay.addEventListener('paste', function (e) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain').trim();

    // Check if pasted text is a valid mathematical expression
    if (/^[\d+\-*/.()]*$/.test(pastedText)) {
        currentCalculation += pastedText; // Append pasted text to the current calculation
        display.innerText = formatDisplay(currentCalculation); // Update the display
        resultDisplay.value = currentCalculation; // Update the input field
        updateResult(); // Dynamically update the result
    } else {
        alert("Invalid input: Only numbers and operators are allowed.");
    }
});


// Function to update the result dynamically
function updateResult() {
    try {
        // Calculate the result only for valid expressions
        if (isValidExpression(currentCalculation) && endsWithCompleteExpression(currentCalculation)) {
            const result = calculate(currentCalculation);
            if (!isNaN(result) && isFinite(result)) {
                resultDisplay.value = result; // Show the result dynamically
            } else {
                resultDisplay.value = ""; // Clear for invalid results
            }
        }
    } catch (e) {
        resultDisplay.value = ""; // Clear the result on error
    }
}



// Helper function to validate the expression
function isValidExpression(expression) {
    const regex = /^-?\d+(\.\d+)?([\+\-\*\/]-?\d+(\.\d+)?)*$/;
    return regex.test(expression);
}

// Helper function to check if an expression ends with a complete input
function endsWithCompleteExpression(expression) {
    const regex = /(\d|\))/; // Ends with a number or closing parenthesis
    return regex.test(expression.slice(-1));
}

// Format the calculation display
function formatDisplay(expression) {
    return expression
        .replace(/(\d)([-+*/])/g, "$1 $2 ")
        .replace(/([-+*/])(\d)/g, "$1 $2 ");
}


buttons.forEach((button) => {
    button.addEventListener("click", function () {
        let value = this.getAttribute("data-value");
        if (value) {
            handleInput(value);
        } else if (this.id === "delete") {
            handleDelete();
        } else if (this.id === "clear") {
            handleClear();
        } else if (this.id === "equals") {
            handleEquals();
        } else if (this.id === "history") {
            openHistoryModal();
        }

        // Update the input field after each button click
        resultDisplay.focus(); // Ensure input field remains active
    });
});


    closeHistoryButton.addEventListener("click", function () {
        historyModal.style.display = "none";
    });
  

    historyModal.addEventListener("click", function (event) {
        if (event.target === historyModal) {
            historyModal.style.display = "none";
        }
    });

    clearHistoryButton.addEventListener("click", function () {
        clearHistory();
    });

 
    historyContent.addEventListener("click", function (event) {
        if (event.target.classList.contains("history-item")) {
            currentCalculation = event.target.innerText.split(" = ")[0];
            display.innerText = formatDisplay(currentCalculation);
            updateResult();
            historyModal.style.display = "none";
        }
    });

    // Theme toggle logic
    let themeToggleButton = document.getElementById('theme-toggle');
    themeToggleButton.addEventListener('click', function () {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        let isDarkTheme = document.body.classList.contains('dark-theme');
        chrome.storage.sync.set({ theme: isDarkTheme ? 'dark' : 'light' });
    });

    // Load saved theme
    chrome.storage.sync.get(['theme'], function (result) {
        if (result.theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
    });

    const observer = new MutationObserver(function (mutationsList) {
        for (let mutation of mutationsList) {
            if (
                mutation.type === "childList" &&
                resultDisplay.innerText !== "" &&
                !isOperator(currentCalculation.slice(-1))
            ) {
                saveToHistory(
                    currentCalculation + " = " + resultDisplay.innerText
                );
            }
        }
    });

    observer.observe(resultDisplay, { childList: true });

    window.addEventListener("beforeunload", function () {
        if (currentCalculation && resultDisplay.innerText !== "") {
            saveToHistory(currentCalculation + " = " + resultDisplay.innerText);
        }
    });

    function handleInput(value) {
        if (isOperator(value)) {
            handleOperator(value);
        } else if (value === ".") {
            handleDecimal();
        } else {
            handleNumber(value);
        }
    
        // Update the display with the current calculation
        display.innerText = formatDisplay(currentCalculation);
    
        // Dynamically evaluate the result
        updateResult();
    }
    
    
    

    function handleOperator(operator) {
        if (operator === "-") {
            if (
                currentCalculation === "" ||
                isOperator(currentCalculation.slice(-1))
            ) {
                if (currentCalculation.slice(-1) !== "-") {
                    currentCalculation += operator;
                }
            } else {
                currentCalculation += operator;
            }
        } else {
            if (
                currentCalculation !== "" &&
                !isOperator(currentCalculation.slice(-1))
            ) {
                currentCalculation += operator;
            }
        }
    }

    function handleDecimal() {
        let lastNumber = getLastNumber(currentCalculation);
        if (!lastNumber.includes(".")) {
            if (lastNumber === "") {
                currentCalculation += "0.";
            } else {
                currentCalculation += ".";
            }
        }
    }

    function handleNumber(number) {
        if (number === "." && currentCalculation === "") {
            currentCalculation += "0.";
        } else {
            currentCalculation += number;
        }
    }
    if (endsWithCompleteExpression(currentCalculation)) {
        resultDisplay.value = calculate(currentCalculation).toString();
    } else {
        resultDisplay.value = ""; // Show nothing for incomplete expressions
    }

    function handlePercentage() {
        // Convert the current number to a percentage
        let lastNumber = getLastNumber(currentCalculation);
        if (lastNumber && !lastNumber.includes("%")) {
            let percentageValue = (parseFloat(lastNumber) / 100).toString();
            currentCalculation = currentCalculation.slice(0, -lastNumber.length) + percentageValue;
        }
    }

    function handleDelete() {
        // Remove the last character from the current calculation
        currentCalculation = currentCalculation.slice(0, -1);
    
        // Update the display and input field
        display.innerText = formatDisplay(currentCalculation) || "0";
        resultDisplay.value = currentCalculation || ""; // Clear resultDisplay if empty
    
        // Dynamically update the result
        updateResult();
    }
    

    function handleClear() {
        if (currentCalculation && resultDisplay.value !== "") {
            saveToHistory(currentCalculation + " = " + resultDisplay.value);
        }
        currentCalculation = "";
        display.innerText = "0";
        resultDisplay.value = "";
    }

    function handleEquals() {
        try {
            const result = calculate(currentCalculation);
            if (!isNaN(result) && isFinite(result)) {
                saveToHistory(`${currentCalculation} = ${result}`);
                currentCalculation = result.toString(); // Replace current calculation with result
                resultDisplay.value = currentCalculation;
                display.innerText = formatDisplay(currentCalculation);
            } else {
                throw new Error("Invalid calculation");
            }
        } catch (e) {
            display.innerText = "Error";
            resultDisplay.value = "";
            currentCalculation = ""; // Clear calculation
        }
    }
    
    

    function isValidExpression(expression) {
        const regex = /^-?\d+(\.\d+)?([\+\-\*\/]-?\d+(\.\d+)?)*$/;
        return regex.test(expression);
    }
    

    function getLastNumber(expression) {
        const match = expression.match(/-?\d*\.?\d*$/);
        return match ? match[0] : "";
    }

    function isOperator(char) {
        return ["+", "-", "*", "/", "%"].includes(char);
    }

    function calculate(expression) {
        try {
            expression = expression.replace(/\s+/g, "");
            expression = expression.replace(/÷/g, "/");
            expression = expression.replace(/×/g, "*");
            if (!/^[\d+\-*/().%]+$/.test(expression)) {
                throw new Error("Invalid characters in expression");
            }
            let result = evaluateExpression(expression);
            return result;
        } catch (e) {
            throw new Error("Invalid calculation");
        }
    }

    function evaluateExpression(expression) {
        try {
            let tokens = expression.match(/(\d+(\.\d+)?|[-+*/%()])/g);
            if (!tokens) throw new Error("Invalid expression");

            let operatorPrecedence = {
                "+": 1,
                "-": 1,
                "*": 2,
                "/": 2,
                "%": 2
            };

            let operators = [];
            let values = [];

            let applyOperator = () => {
                let operator = operators.pop();
                let b = values.pop();
                let a = values.pop();
                switch (operator) {
                    case "+":
                        values.push(a + b);
                        break;
                    case "-":
                        values.push(a - b);
                        break;
                    case "*":
                        values.push(a * b);
                        break;
                    case "/":
                        if (b === 0) throw new Error("Division by zero");
                        values.push(a / b);
                        break;
                    case "%":
                        values.push(a * (b / 100));
                        break;
                    default:
                        throw new Error("Invalid operator");
                }
            };

            let i = 0;
            while (i < tokens.length) {
                let token = tokens[i];

                if (!isNaN(parseFloat(token))) {
                    values.push(parseFloat(token));
                } else if (token === "(") {
                    operators.push(token);
                } else if (token === ")") {
                    while (operators.length && operators[operators.length - 1] !== "(") {
                        applyOperator();
                    }
                    operators.pop();
                } else if (operatorPrecedence[token]) {
                    if (token === "-" && (i === 0 || tokens[i - 1] === "(" || operatorPrecedence[tokens[i - 1]])) {
                        values.push(0); // Handle negative numbers
                    }
                    while (
                        operators.length &&
                        operatorPrecedence[operators[operators.length - 1]] >= operatorPrecedence[token]
                    ) {
                        applyOperator();
                    }
                    operators.push(token);
                }
                i++;
            }

            while (operators.length) {
                applyOperator();
            }

            return values.pop();
        } catch (e) {
            throw new Error("Invalid expression evaluation");
        }
    }

    // function formatDisplay(expression) {
    //     return expression
    //         .replace(/(\d)([-+*/])/g, "$1 $2 ")
    //         .replace(/([-+*/])(\d)/g, "$1 $2 ");
    // }

    function animateDisplay() {
        display.style.transform = "scale(1.1)";
        setTimeout(() => {
            display.style.transform = "scale(1)";
        }, 100);
    }
    
    function saveToHistory(entry) {
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const timestamp = now.toISOString().split("T")[1].split(".")[0];
    
        if (!historyEntries[today]) {
            historyEntries[today] = [];
        }
    
        if (!historyEntries[today].some((item) => item.entry === entry)) {
            const historyItem = document.createElement("div");
            historyItem.classList.add("history-item");
            historyItem.innerText = `${entry} (${timestamp})`;
            historyContent.prepend(historyItem);
            historyEntries[today].push({ entry, timestamp });
            chrome.storage.sync.set({ historyEntries: historyEntries });
        }
    }

    
    function openHistoryModal() {
        chrome.storage.sync.get("historyEntries", function (data) {
            historyEntries = data.historyEntries || {};
            displayHistory();
            historyModal.style.display = "block";
        });
    }
    
    function clearHistory() {
        historyEntries = {};
        chrome.storage.sync.set(
            { historyEntries: historyEntries },
            function () {
                displayHistory();
            }
        );
    }
    
    function displayHistory() {
        historyContent.innerHTML = "";
        historyContent.appendChild(closeHistoryButton);
        historyContent.appendChild(clearHistoryButton);
    
        // Sort dates in descending order
        const sortedDates = Object.keys(historyEntries).sort((a, b) => new Date(b) - new Date(a));
    
        sortedDates.forEach((date) => {
            const dateHeader = document.createElement("h4");
            dateHeader.innerText = date;
            historyContent.appendChild(dateHeader);
    
            // Sort entries by timestamp in descending order within each date
            const sortedEntries = historyEntries[date].sort((a, b) => {
                const timeA = new Date(`1970-01-01T${a.timestamp}Z`);
                const timeB = new Date(`1970-01-01T${b.timestamp}Z`);
                return timeB - timeA;  // Descending order
            });
    
            sortedEntries.forEach((item) => {
                const historyItem = document.createElement("div");
                historyItem.classList.add("history-item");
                historyItem.innerText = `${item.entry} (${item.timestamp})`;
                historyContent.appendChild(historyItem);
            });
        });
    }
    
    
    // function formatDisplay(expression) {
    //     return addSpacesBetweenCharacters(expression.replace(/\//g, "÷").replace(/\*/g, "×"));
    // }
    
    function addSpacesBetweenCharacters(str) {
        return str.replace(/([+\-*/×÷])/g, " $1 ");
    }
    
    function isSingleNumber(expression) {
        return /^-?\d+(\.\d+)?$/.test(expression);
    }
    
    // Format the calculation display
    function formatDisplay(expression) {
        return expression
            .replace(/\//g, "÷")
            .replace(/\*/g, "×")
            .replace(/(\d)([-+*/÷×])/g, "$1 $2 ")
            .replace(/([-+*/÷×])(\d)/g, "$1 $2 ")
            .trim();
    }
    
    // Load saved history from chrome.storage.sync on page load
    chrome.storage.sync.get("historyEntries", function (data) {
        historyEntries = data.historyEntries || {};
        displayHistory();
    });
    // Handle tabs switching
    document
        .getElementById("calculator-tab")
        .addEventListener("click", function () {
            document.getElementById("calculator").classList.add("active");
            document.getElementById("converter").classList.remove("active");
            this.classList.add("active");
            document.getElementById("converter-tab").classList.remove("active");
        });

    document
        .getElementById("converter-tab")
        .addEventListener("click", function () {
            document.getElementById("calculator").classList.remove("active");
            document.getElementById("converter").classList.add("active");
            this.classList.add("active");
            document
                .getElementById("calculator-tab")
                .classList.remove("active");
        });

    
    
    

// This Defines the conversion options for each type
const conversionOptions = {
    length: [
        { value: "centimeter", text: "Centimeter" },
        { value: "meter", text: "Meter" },
        { value: "inch", text: "Inch" },
        { value: "foot", text: "Foot" },
        { value: "yard", text: "Yard" }
    ],
    temperature: [
        { value: "celsius", text: "Celsius" },
        { value: "fahrenheit", text: "Fahrenheit" },
        { value: "kelvin", text: "Kelvin" }
    ],
    mass: [
        { value: "ton", text: "Ton" },
        { value: "ounce", text: "Ounce" },
        { value: "pound", text: "Pound" },
        { value: "kilogram", text: "Kilogram" },
        { value: "gram", text: "Gram" }
    ],
    data: [
        { value: "bit", text: "Bit" },
        { value: "byte", text: "Byte" },
        { value: "kilobyte", text: "Kilobyte" },
        { value: "megabyte", text: "Megabyte" },
        { value: "gigabyte", text: "Gigabyte" },
        { value: "terabyte", text: "Terabyte" }
    ]
};

// This Function is to update the 'from' and 'to' dropdowns based on selected conversion type
function updateConverterFields(conversionType) {
    const fromSelect = document.getElementById('converter-from');
    const toSelect = document.getElementById('converter-to');

    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    conversionOptions[conversionType].forEach(option => {
        const fromOption = document.createElement('option');
        fromOption.value = option.value;
        fromOption.text = option.text;
        fromSelect.add(fromOption);

        const toOption = document.createElement('option');
        toOption.value = option.value;
        toOption.text = option.text;
        toSelect.add(toOption);
    });

    // This to Disable the same unit initially
    disableSameUnit('converter-from', 'converter-to');
}

function disableSameUnit(sourceId, targetId) {
    let sourceValue = document.getElementById(sourceId).value;
    let targetDropdown = document.getElementById(targetId);
    let sourceDropdown = document.getElementById(sourceId);

    // This to Disable the selected unit in the target dropdown
    Array.from(targetDropdown.options).forEach((option) => {
        option.disabled = option.value === sourceValue;
    });

    // Ensure the target dropdown value is not the same as source
    if (targetDropdown.value === sourceValue) {
        targetDropdown.value = Array.from(targetDropdown.options).find(
            (option) => !option.disabled
        ).value;
    }

    // The same in reverse to disable in source based on target's selection
    let targetValue = targetDropdown.value;
    Array.from(sourceDropdown.options).forEach((option) => {
        option.disabled = option.value === targetValue;
    });
}


    const conversionTypeSelect = document.getElementById('conversion-type');

    conversionTypeSelect.addEventListener('change', function () {
        updateConverterFields(this.value);
    });
    

    // Initialize with default selection
    updateConverterFields(conversionTypeSelect.value);

    // Add event listeners for conversion updates
    document.getElementById('converter-input').addEventListener('input', updateConversion);
    document.getElementById('converter-from').addEventListener('change', () => {
        updateConversion();
        disableSameUnit('converter-from', 'converter-to');
    });
    document.getElementById('converter-to').addEventListener('change', () => {
        updateConversion();
        disableSameUnit('converter-from', 'converter-to');
    });


    clearInputButton.addEventListener("click", function () {
        document.getElementById('converter-input').value = ""
    });


function updateConversion() {
    const conversionType = document.getElementById('conversion-type').value;
    const fromUnit = document.getElementById('converter-from').value;
    const toUnit = document.getElementById('converter-to').value;
    const inputValue = parseFloat(document.getElementById('converter-input').value);

    let result;
    switch (conversionType) {
        case 'length':
            result = convertLength(inputValue, fromUnit, toUnit);
            break;
        case 'temperature':
            result = convertTemperature(inputValue, fromUnit, toUnit);
            break;
        case 'mass':
            result = convertMass(inputValue, fromUnit, toUnit);
            break;
        case 'data':
            result = convertData(inputValue, fromUnit, toUnit);
            break;
        default:
            result = 'Invalid conversion type';
    }

    document.getElementById('converter-result').innerText = isNaN(result) ? "" : result;
}

// conversion functions
function convertLength(value, from, to) {
    if (from === to) return value;
    const conversionRates = {
        centimeter: { centimeter: 1, meter: 0.01, inch: 0.393701, foot: 0.0328084, yard: 0.0109361 },
        meter: { centimeter: 100, meter: 1, inch: 39.3701, foot: 3.28084, yard: 1.09361 },
        inch: { centimeter: 2.54, meter: 0.0254, inch: 1, foot: 0.0833333, yard: 0.0277778 },
        foot: { centimeter: 30.48, meter: 0.3048, inch: 12, foot: 1, yard: 0.333333 },
        yard: { centimeter: 91.44, meter: 0.9144, inch: 36, foot: 3, yard: 1 }
    };
    return value * (conversionRates[from][to] || 1);
}

function convertTemperature(value, from, to) {
    if (from === to) return value;
    let result;
    if (from === "celsius" && to === "fahrenheit") {
        result = (value * 9) / 5 + 32;
    } else if (from === "celsius" && to === "kelvin") {
        result = value + 273.15;
    } else if (from === "fahrenheit" && to === "celsius") {
        result = ((value - 32) * 5) / 9;
    } else if (from === "fahrenheit" && to === "kelvin") {
        result = ((value - 32) * 5) / 9 + 273.15;
    } else if (from === "kelvin" && to === "celsius") {
        result = value - 273.15;
    } else if (from === "kelvin" && to === "fahrenheit") {
        result = ((value - 273.15) * 9) / 5 + 32;
    }
    return result;
}

function convertMass(value, from, to) {
    if (from === to) return value;
    const conversionRates = {
        ton: { ton: 1, ounce: 35273.9619, pound: 2204.62262, kilogram: 1000, gram: 1e6 },
        ounce: { ton: 2.835e-5, ounce: 1, pound: 0.0625, kilogram: 0.0283495, gram: 28.3495 },
        pound: { ton: 0.000453592, ounce: 16, pound: 1, kilogram: 0.453592, gram: 453.592 },
        kilogram: { ton: 0.001, ounce: 35.2739619, pound: 2.20462262, kilogram: 1, gram: 1000 },
        gram: { ton: 1e-6, ounce: 0.0352739619, pound: 0.00220462262, kilogram: 0.001, gram: 1 }
    };
    return value * (conversionRates[from][to] || 1);
}

function convertData(value, from, to) {
    if (from === to) return value;
    const conversionRates = {
        bit: { bit: 1, byte: 0.125, kilobyte: 1.25e-4, megabyte: 1.25e-7, gigabyte: 1.25e-10, terabyte: 1.25e-13 },
        byte: { bit: 8, byte: 1, kilobyte: 0.001, megabyte: 1e-6, gigabyte: 1e-9, terabyte: 1e-12 },
        kilobyte: { bit: 8000, byte: 1000, kilobyte: 1, megabyte: 0.001, gigabyte: 1e-6, terabyte: 1e-9 },
        megabyte: { bit: 8e6, byte: 1e6, kilobyte: 1000, megabyte: 1, gigabyte: 0.001, terabyte: 1e-6 },
        gigabyte: { bit: 8e9, byte: 1e9, kilobyte: 1e6, megabyte: 1000, gigabyte: 1, terabyte: 0.001 },
        terabyte: { bit: 8e12, byte: 1e12, kilobyte: 1e9, megabyte: 1e6, gigabyte: 1000, terabyte: 1 }
    };
    return value * (conversionRates[from][to] || 1);
}

        
});
