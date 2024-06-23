document.addEventListener('DOMContentLoaded', function () {
    let display = document.getElementById('calc-display');
    let resultDisplay = document.getElementById('calc-result');
    let buttons = document.querySelectorAll('.calc-btn');
    let historyModal = document.getElementById('history-modal');
    let historyContent = document.getElementById('history-content');
    let clearHistoryButton = document.getElementById('clear-history');
    let closeHistoryButton = document.querySelector('.close-button');
    let currentCalculation = '';
    let historyEntries = {};

    buttons.forEach(button => {
        button.addEventListener('click', function () {
            let value = this.getAttribute('data-value');
            if (value) {
                handleInput(value);
            } else if (this.id === 'delete') {
                handleDelete();
            } else if (this.id === 'clear') {
                handleClear();
            } else if (this.id === 'equals') {
                handleEquals();
            } else if (this.id === 'history') {
                openHistoryModal();
            }
        });
    });

    closeHistoryButton.addEventListener('click', function () {
        historyModal.style.display = 'none';
    });

    historyModal.addEventListener('click', function (event) {
        if (event.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });

    clearHistoryButton.addEventListener('click', function () {
        clearHistory();
    });

    historyContent.addEventListener('click', function (event) {
        if (event.target.classList.contains('history-item')) {
            currentCalculation = event.target.innerText.split(' = ')[0];
            display.innerText = formatDisplay(currentCalculation);
            updateResult();
            historyModal.style.display = 'none';
        }
    });

    const observer = new MutationObserver(function (mutationsList) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' && resultDisplay.innerText !== '' && !isOperator(currentCalculation.slice(-1))) {
                saveToHistory(currentCalculation + ' = ' + resultDisplay.innerText);
            }
        }
    });

    observer.observe(resultDisplay, { childList: true });

    window.addEventListener('beforeunload', function () {
        if (currentCalculation && resultDisplay.innerText !== '') {
            saveToHistory(currentCalculation + ' = ' + resultDisplay.innerText);
        }
    });

    function handleInput(value) {
        if (isOperator(value)) {
            handleOperator(value);
        } else if (value === '.') {
            handleDecimal();
        } else {
            handleNumber(value);
        }
        display.innerText = formatDisplay(currentCalculation);
        animateDisplay();
        updateResult();
    }

    function handleOperator(operator) {
        if (operator === '-') {
            if (currentCalculation === '' || isOperator(currentCalculation.slice(-1))) {
                if (currentCalculation.slice(-1) !== '-') {
                    currentCalculation += operator;
                }
            } else {
                currentCalculation += operator;
            }
        } else {
            if (currentCalculation !== '' && !isOperator(currentCalculation.slice(-1))) {
                currentCalculation += operator;
            }
        }
    }

    function handleDecimal() {
        let lastNumber = getLastNumber(currentCalculation);
        if (!lastNumber.includes('.')) {
            currentCalculation += '.';
        }
    }

    function handleNumber(number) {
        if (currentCalculation === '' && number === '.') {
            currentCalculation += '0.';
        } else {
            currentCalculation += number;
        }
    }

    function handleDelete() {
        currentCalculation = currentCalculation.slice(0, -1);
        display.innerText = formatDisplay(currentCalculation) || '0';
        updateResult();
    }

    function handleClear() {
        if (currentCalculation && resultDisplay.innerText !== '') {
            saveToHistory(currentCalculation + ' = ' + resultDisplay.innerText);
        }
        currentCalculation = '';
        display.innerText = '0';
        resultDisplay.innerText = '';
    }

    function handleEquals() {
        try {
            let result = calculate(currentCalculation);
            if (isNaN(result) || !isFinite(result)) throw new Error("Result is not a valid number");
            saveToHistory(currentCalculation + ' = ' + result);
            display.innerText = result;
            currentCalculation = result.toString();
        } catch (e) {
            display.innerText = 'Error';
            currentCalculation = '';
        }
    }

    function updateResult() {
        try {
            if (isValidExpression(currentCalculation) && !isSingleNumber(currentCalculation)) {
                let result = calculate(currentCalculation);
                if (!isNaN(result) && isFinite(result)) {
                    resultDisplay.innerText = result;
                } else {
                    resultDisplay.innerText = '';
                }
            } else {
                resultDisplay.innerText = '';
            }
        } catch (e) {
            resultDisplay.innerText = '';
        }
    }

    function isValidExpression(expression) {
        const regex = /^-?\d+(\.\d+)?([\+\-\*\/]\d+(\.\d+)?)*$/;
        const lastChar = expression.slice(-1);
        return regex.test(expression) && !isOperator(lastChar);
    }

    function getLastNumber(expression) {
        const match = expression.match(/-?\d*\.?\d*$/);
        return match ? match[0] : '';
    }

    function isOperator(char) {
        return ['+', '-', '*', '/'].includes(char);
    }

    function calculate(expression) {
        try {
            expression = expression.replace(/\s+/g, '');
            expression = expression.replace(/÷/g, '/');
            expression = expression.replace(/×/g, '*');
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
            let tokens = expression.match(/-?\d+(\.\d+)?|[\+\-\*\/()]/g);
            if (!tokens) throw new Error("Invalid expression");

            let operatorPrecedence = {
                '+': 1,
                '-': 1,
                '*': 2,
                '/': 2
            };

            let operators = [];
            let values = [];

            let applyOperator = () => {
                let operator = operators.pop();
                let b = values.pop();
                let a = values.pop();
                switch (operator) {
                    case '+': values.push(a + b); break;
                    case '-': values.push(a - b); break;
                    case '*': values.push(a * b); break;
                    case '/': values.push(a / b); break;
                    default: throw new Error("Invalid operator");
                }
            };

            let i = 0;
            while (i < tokens.length) {
                let token = tokens[i];

                if (/\d/.test(token)) {
                    values.push(parseFloat(token));
                } else if (token === '(') {
                    operators.push(token);
                } else if (token === ')') {
                    while (operators.length && operators[operators.length - 1] !== '(') {
                        applyOperator();
                    }
                    operators.pop();
                } else if (operatorPrecedence[token]) {
                    while (operators.length && operatorPrecedence[operators[operators.length - 1]] >= operatorPrecedence[token]) {
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
            throw new Error("Invalid expression");
        }
    }

    function animateDisplay() {
        display.style.transform = 'scale(1.1)';
        setTimeout(() => display.style.transform = 'scale(1)', 100);
    }

    function saveToHistory(entry) {
        const now = new Date();
        const today = now.toLocaleDateString();
        const timestamp = now.toLocaleTimeString();

        if (!historyEntries[today]) {
            historyEntries[today] = [];
        }

        if (!historyEntries[today].some(item => item.entry === entry)) {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.innerText = `${entry} (${timestamp})`;
            historyContent.prepend(historyItem);
            historyEntries[today].push({ entry, timestamp });
            chrome.storage.sync.set({ historyEntries: historyEntries });
        }
    }

    function openHistoryModal() {
        chrome.storage.sync.get('historyEntries', function (data) {
            historyEntries = data.historyEntries || {};
            displayHistory();
            historyModal.style.display = 'block';
        });
    }

    function clearHistory() {
        historyEntries = {};
        chrome.storage.sync.set({ historyEntries: historyEntries }, function () {
            displayHistory();
        });
    }

    function displayHistory() {
        historyContent.innerHTML = '';
        historyContent.appendChild(closeHistoryButton);
        historyContent.appendChild(clearHistoryButton);

        Object.keys(historyEntries).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
            const dateHeader = document.createElement('h4');
            dateHeader.innerText = date;
            historyContent.appendChild(dateHeader);

            historyEntries[date].forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.classList.add('history-item');
                historyItem.innerText = `${item.entry} (${item.timestamp})`;
                historyContent.appendChild(historyItem);
            });
        });
    }

    function formatDisplay(expression) {
        return expression.replace(/\//g, '÷').replace(/\*/g, '×');
    }

    function isSingleNumber(expression) {
        return /^-?\d+(\.\d+)?$/.test(expression);
    }

    // Load saved history from chrome.storage.sync on page load
    chrome.storage.sync.get('historyEntries', function (data) {
        historyEntries = data.historyEntries || {};
        displayHistory();
    });
    // Handle tabs switching
    document.getElementById('calculator-tab').addEventListener('click', function () {
      document.getElementById('calculator').classList.add('active');
      document.getElementById('converter').classList.remove('active');
      this.classList.add('active');
      document.getElementById('converter-tab').classList.remove('active');
    });

    document.getElementById('converter-tab').addEventListener('click', function () {
      document.getElementById('calculator').classList.remove('active');
      document.getElementById('converter').classList.add('active');
      this.classList.add('active');
      document.getElementById('calculator-tab').classList.remove('active');
    });

    // document.getElementById('convert-length').addEventListener('click', function () {
    //     let input = parseFloat(document.getElementById('length-input').value);
    //     let fromUnit = document.getElementById('length-from').value;
    //     let toUnit = document.getElementById('length-to').value;
    //     let result = convertLength(input, fromUnit, toUnit);
    //     document.getElementById('length-result').innerText = result;
    //   });
    
    //   function convertLength(value, from, to) {
    //     const conversions = {
    //       inches: { feet: 0.0833333, meters: 0.0254, kilometers: 0.0000254, miles: 0.0000157828 },
    //       feet: { inches: 12, meters: 0.3048, kilometers: 0.0003048, miles: 0.000189394 },
    //       meters: { inches: 39.3701, feet: 3.28084, kilometers: 0.001, miles: 0.000621371 },
    //       kilometers: { inches: 39370.1, feet: 3280.84, meters: 1000, miles: 0.621371 },
    //       miles: { inches: 63360, feet: 5280, meters: 1609.34, kilometers: 1.60934 }
    //     };
    //     if (from === to) return value;
    //     return value * (conversions[from][to] || 1);
    //   }

      document.getElementById('convert-data').addEventListener('click', function () {
        let input = parseFloat(document.getElementById('data-input').value);
        let fromUnit = document.getElementById('data-from').value;
        let toUnit = document.getElementById('data-to').value;
        let result = convertData(input, fromUnit, toUnit);
        document.getElementById('data-result').innerText = result;
    });
   // Data conversion logic
   document.getElementById('convert-data').addEventListener('click', function () {
    let input = parseFloat(document.getElementById('data-input').value);
    let fromUnit = document.getElementById('data-from').value;
    let toUnit = document.getElementById('data-to').value;
    let result = convertData(input, fromUnit, toUnit);
    document.getElementById('data-result').innerText = result;
});

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

// Length conversion logic
document.getElementById('convert-length').addEventListener('click', function () {
    let input = parseFloat(document.getElementById('length-input').value);
    let fromUnit = document.getElementById('length-from').value;
    let toUnit = document.getElementById('length-to').value;
    let result = convertLength(input, fromUnit, toUnit);
    document.getElementById('length-result').innerText = result;
});

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

// Temperature conversion logic
document.getElementById('convert-temperature').addEventListener('click', function () {
    let input = parseFloat(document.getElementById('temperature-input').value);
    let fromUnit = document.getElementById('temperature-from').value;
    let toUnit = document.getElementById('temperature-to').value;
    let result = convertTemperature(input, fromUnit, toUnit);
    document.getElementById('temperature-result').innerText = result;
});

function convertTemperature(value, from, to) {
    if (from === to) return value;
    let result;
    if (from === 'celsius' && to === 'fahrenheit') {
        result = (value * 9/5) + 32;
    } else if (from === 'celsius' && to === 'kelvin') {
        result = value + 273.15;
    } else if (from === 'fahrenheit' && to === 'celsius') {
        result = (value - 32) * 5/9;
    } else if (from === 'fahrenheit' && to === 'kelvin') {
        result = ((value - 32) * 5/9) + 273.15;
    } else if (from === 'kelvin' && to === 'celsius') {
        result = value - 273.15;
    } else if (from === 'kelvin' && to === 'fahrenheit') {
        result = ((value - 273.15) * 9/5) + 32;
    }
    return result;
}

// Mass conversion logic
document.getElementById('convert-mass').addEventListener('click', function () {
    let input = parseFloat(document.getElementById('mass-input').value);
    let fromUnit = document.getElementById('mass-from').value;
    let toUnit = document.getElementById('mass-to').value;
    let result = convertMass(input, fromUnit, toUnit);
    document.getElementById('mass-result').innerText = result;
});

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
});
