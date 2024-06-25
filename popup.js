document.addEventListener("DOMContentLoaded", function () {
    let display = document.getElementById("calc-display");
    let resultDisplay = document.getElementById("calc-result");
    let buttons = document.querySelectorAll(".calc-btn");
    let historyModal = document.getElementById("history-modal");
    let historyContent = document.getElementById("history-content");
    let clearHistoryButton = document.getElementById("clear-history");
    let closeHistoryButton = document.querySelector(".close-button");
    let currentCalculation = "";
    let historyEntries = {};

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
        display.innerText = formatDisplay(currentCalculation);
        animateDisplay();
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
            currentCalculation += ".";
        }
    }

    function handleNumber(number) {
        if (currentCalculation === "" && number === ".") {
            currentCalculation += "0.";
        } else {
            currentCalculation += number;
        }
    }

    function handleDelete() {
        currentCalculation = currentCalculation.slice(0, -1);
        display.innerText = formatDisplay(currentCalculation) || "0";
        updateResult();
    }

    function handleClear() {
        if (currentCalculation && resultDisplay.innerText !== "") {
            saveToHistory(currentCalculation + " = " + resultDisplay.innerText);
        }
        currentCalculation = "";
        display.innerText = "0";
        resultDisplay.innerText = "";
    }

    function handleEquals() {
        try {
            let result = calculate(currentCalculation);
            if (isNaN(result) || !isFinite(result))
                throw new Error("Result is not a valid number");
            saveToHistory(currentCalculation + " = " + result);
            // display.innerText = result;
            currentCalculation = result.toString();
        } catch (e) {
            display.innerText = "Error";
            currentCalculation = "";
        }
    }

    function updateResult() {
        try {
            if (
                isValidExpression(currentCalculation) &&
                !isSingleNumber(currentCalculation)
            ) {
                let result = calculate(currentCalculation);
                if (!isNaN(result) && isFinite(result)) {
                    resultDisplay.innerText = result;
                } else {
                    resultDisplay.innerText = "";
                }
            } else {
                resultDisplay.innerText = "";
            }
        } catch (e) {
            resultDisplay.innerText = "";
        }
    }

    function isValidExpression(expression) {
        const regex = /^-?\d+(\.\d+)?([\+\-\*\/]\d+(\.\d+)?)*$/;
        const lastChar = expression.slice(-1);
        return regex.test(expression) && !isOperator(lastChar);
    }

    function getLastNumber(expression) {
        const match = expression.match(/-?\d*\.?\d*$/);
        return match ? match[0] : "";
    }

    function isOperator(char) {
        return ["+", "-", "*", "/"].includes(char);
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
            // Tokenize the expression, including handling negative numbers and decimals
            let tokens = expression.match(/(\d+(\.\d+)?|[-+*/()])/g);
            if (!tokens) throw new Error("Invalid expression");
    
            let operatorPrecedence = {
                "+": 1,
                "-": 1,
                "*": 2,
                "/": 2
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
                    default:
                        throw new Error("Invalid operator");
                }
            };
    
            let i = 0;
            while (i < tokens.length) {
                let token = tokens[i];
    
                if (!isNaN(parseFloat(token))) {
                    // It's a number
                    values.push(parseFloat(token));
                } else if (token === "(") {
                    operators.push(token);
                } else if (token === ")") {
                    while (operators.length && operators[operators.length - 1] !== "(") {
                        applyOperator();
                    }
                    operators.pop(); // Remove the '(' from the stack
                } else if (operatorPrecedence[token]) {
                    // Handle unary minus (e.g., "-3")
                    if (token === "-" && (i === 0 || tokens[i - 1] === "(" || operatorPrecedence[tokens[i - 1]])) {
                        values.push(0); // Push 0 to treat "-number" as "0-number"
                    }
                    while (
                        operators.length &&
                        operatorPrecedence[operators[operators.length - 1]] >=
                        operatorPrecedence[token]
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
    
            if (values.length !== 1) throw new Error("Invalid expression");
            return values.pop();
        } catch (e) {
            console.error(e);
            throw new Error("Invalid expression");
        }
    }
    

    function animateDisplay() {
        display.style.transform = "scale(1.1)";
        setTimeout(() => (display.style.transform = "scale(1)"), 100);
    }

    function saveToHistory(entry) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];  // Use ISO format date (YYYY-MM-DD)
        const timestamp = now.toISOString().split('T')[1].split('.')[0];  // Use ISO format time (HH:MM:SS)
    
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
            const sortedEntries = historyEntries[date].sort((a, b) => new Date(`1970-01-01T${a.timestamp}Z`) - new Date(`1970-01-01T${b.timestamp}Z`) );
            
            sortedEntries.forEach((item) => {
                const historyItem = document.createElement("div");
                historyItem.classList.add("history-item");
                historyItem.innerText = `${item.entry} (${item.timestamp})`;
                historyContent.appendChild(historyItem);
            });
        });
    }
    
    
    

    function formatDisplay(expression) {
        return addSpacesBetweenCharacters(expression.replace(/\//g, "÷").replace(/\*/g, "×"));
    }

    function addSpacesBetweenCharacters(str) {
        return str.replace(/([+\-*/×÷])/g, ' $1 ');
    }

    function isSingleNumber(expression) {
        return /^-?\d+(\.\d+)?$/.test(expression);
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

    // Disable the same unit in the opposite dropdown
    function disableSameUnit(sourceId, targetId) {
        let sourceValue = document.getElementById(sourceId).value;
        let targetDropdown = document.getElementById(targetId);
        let sourceDropdown = document.getElementById(sourceId);

        // Disable the selected unit in the target dropdown
        Array.from(targetDropdown.options).forEach((option) => {
            option.disabled = option.value === sourceValue;
        });

        // Also ensure the target dropdown value is not the same as source
        if (targetDropdown.value === sourceValue) {
            targetDropdown.value = Array.from(targetDropdown.options).find(
                (option) => !option.disabled
            ).value;
        }

        // Now, do the same in reverse to disable in source based on target's selection
        let targetValue = targetDropdown.value;
        Array.from(sourceDropdown.options).forEach((option) => {
            option.disabled = option.value === targetValue;
        });
    }

    // General update function for conversion
    function updateConversion(
        converterFunction,
        inputId,
        fromId,
        toId,
        resultId
    ) {
        let input = parseFloat(document.getElementById(inputId).value);
        let fromUnit = document.getElementById(fromId).value;
        let toUnit = document.getElementById(toId).value;
        let result = converterFunction(input, fromUnit, toUnit);
        document.getElementById(resultId).innerText = isNaN(result)
            ? ""
            : result;
    }

    // Specific update functions for each conversion type
    function updateLengthConversion() {
        updateConversion(
            convertLength,
            "length-input",
            "length-from",
            "length-to",
            "length-result"
        );
        disableSameUnit("length-from", "length-to");
    }

    function updateTemperatureConversion() {
        updateConversion(
            convertTemperature,
            "temperature-input",
            "temperature-from",
            "temperature-to",
            "temperature-result"
        );
        disableSameUnit("temperature-from", "temperature-to");
    }

    function updateMassConversion() {
        updateConversion(
            convertMass,
            "mass-input",
            "mass-from",
            "mass-to",
            "mass-result"
        );
        disableSameUnit("mass-from", "mass-to");
    }

    function updateDataConversion() {
        updateConversion(
            convertData,
            "data-input",
            "data-from",
            "data-to",
            "data-result"
        );
        disableSameUnit("data-from", "data-to");
    }

    // Conversion functions
    function convertLength(value, from, to) {
        if (from === to) return value;
        const conversionRates = {
            centimeter: {
                centimeter: 1,
                meter: 0.01,
                inch: 0.393701,
                foot: 0.0328084,
                yard: 0.0109361,
            },
            meter: {
                centimeter: 100,
                meter: 1,
                inch: 39.3701,
                foot: 3.28084,
                yard: 1.09361,
            },
            inch: {
                centimeter: 2.54,
                meter: 0.0254,
                inch: 1,
                foot: 0.0833333,
                yard: 0.0277778,
            },
            foot: {
                centimeter: 30.48,
                meter: 0.3048,
                inch: 12,
                foot: 1,
                yard: 0.333333,
            },
            yard: {
                centimeter: 91.44,
                meter: 0.9144,
                inch: 36,
                foot: 3,
                yard: 1,
            },
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
            ton: {
                ton: 1,
                ounce: 35273.9619,
                pound: 2204.62262,
                kilogram: 1000,
                gram: 1e6,
            },
            ounce: {
                ton: 2.835e-5,
                ounce: 1,
                pound: 0.0625,
                kilogram: 0.0283495,
                gram: 28.3495,
            },
            pound: {
                ton: 0.000453592,
                ounce: 16,
                pound: 1,
                kilogram: 0.453592,
                gram: 453.592,
            },
            kilogram: {
                ton: 0.001,
                ounce: 35.2739619,
                pound: 2.20462262,
                kilogram: 1,
                gram: 1000,
            },
            gram: {
                ton: 1e-6,
                ounce: 0.0352739619,
                pound: 0.00220462262,
                kilogram: 0.001,
                gram: 1,
            },
        };
        return value * (conversionRates[from][to] || 1);
    }

    function convertData(value, from, to) {
        if (from === to) return value;
        const conversionRates = {
            bit: {
                bit: 1,
                byte: 0.125,
                kilobyte: 1.25e-4,
                megabyte: 1.25e-7,
                gigabyte: 1.25e-10,
                terabyte: 1.25e-13,
            },
            byte: {
                bit: 8,
                byte: 1,
                kilobyte: 0.001,
                megabyte: 1e-6,
                gigabyte: 1e-9,
                terabyte: 1e-12,
            },
            kilobyte: {
                bit: 8000,
                byte: 1000,
                kilobyte: 1,
                megabyte: 0.001,
                gigabyte: 1e-6,
                terabyte: 1e-9,
            },
            megabyte: {
                bit: 8e6,
                byte: 1e6,
                kilobyte: 1000,
                megabyte: 1,
                gigabyte: 0.001,
                terabyte: 1e-6,
            },
            gigabyte: {
                bit: 8e9,
                byte: 1e9,
                kilobyte: 1e6,
                megabyte: 1000,
                gigabyte: 1,
                terabyte: 0.001,
            },
            terabyte: {
                bit: 8e12,
                byte: 1e12,
                kilobyte: 1e9,
                megabyte: 1e6,
                gigabyte: 1000,
                terabyte: 1,
            },
        };
        return value * (conversionRates[from][to] || 1);
    }

    // Attach event listeners for each converter type
    document
        .getElementById("length-input")
        .addEventListener("input", updateLengthConversion);
    document
        .getElementById("length-from")
        .addEventListener("change", updateLengthConversion);
    document
        .getElementById("length-to")
        .addEventListener("change", updateLengthConversion);

    document
        .getElementById("temperature-input")
        .addEventListener("input", updateTemperatureConversion);
    document
        .getElementById("temperature-from")
        .addEventListener("change", updateTemperatureConversion);
    document
        .getElementById("temperature-to")
        .addEventListener("change", updateTemperatureConversion);

    document
        .getElementById("mass-input")
        .addEventListener("input", updateMassConversion);
    document
        .getElementById("mass-from")
        .addEventListener("change", updateMassConversion);
    document
        .getElementById("mass-to")
        .addEventListener("change", updateMassConversion);

    document
        .getElementById("data-input")
        .addEventListener("input", updateDataConversion);
    document
        .getElementById("data-from")
        .addEventListener("change", updateDataConversion);
    document
        .getElementById("data-to")
        .addEventListener("change", updateDataConversion);

    // Initial disable same unit and conversion
    updateLengthConversion();
    updateTemperatureConversion();
    updateMassConversion();
    updateDataConversion();
});
