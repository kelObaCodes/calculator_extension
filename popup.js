document.addEventListener('DOMContentLoaded', function () {
    let display = document.getElementById('calc-display');
    let resultDisplay = document.getElementById('calc-result');
    let buttons = document.querySelectorAll('.calc-btn');
    let historyModal = document.getElementById('history-modal');
    let closeHistoryButton = document.querySelector('.close-button');
    let historyContent = document.getElementById('history-content');
    let clearHistoryButton = document.getElementById('clear-history');
    let currentCalculation = '';
  
    buttons.forEach(button => {
      button.addEventListener('click', function () {
        let value = this.getAttribute('data-value');
        if (value) {
          if (isOperator(value) && isOperator(currentCalculation.slice(-1))) {
            // Prevent consecutive operators
            return;
          }
          currentCalculation += value;
          display.innerText = currentCalculation;
          animateDisplay();
          updateResult();
        } else if (this.id === 'delete') {
          currentCalculation = currentCalculation.slice(0, -1);
          display.innerText = currentCalculation || '0';
          updateResult();
        } else if (this.id === 'clear') {
          currentCalculation = '';
          display.innerText = '0';
          resultDisplay.innerText = '';
        } else if (this.id === 'equals') {
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
        } else if (this.id === 'history') {
          openHistoryModal();
        }
      });
    });
  
    closeHistoryButton.addEventListener('click', function () {
      historyModal.style.display = 'none';
    });
  
    clearHistoryButton.addEventListener('click', function () {
      chrome.storage.sync.set({ calcHistory: [] }, function () {
        loadHistory();
      });
    });
  
    function saveToHistory(calc) {
      let historyEntry = {
        calculation: calc,
        timestamp: new Date().toLocaleString()
      };
  
      chrome.storage.sync.get(['calcHistory'], function (result) {
        let calcHistory = result.calcHistory || [];
        calcHistory.push(historyEntry);
        chrome.storage.sync.set({ calcHistory: calcHistory }, function () {
          loadHistory();
        });
      });
    }
  
    function loadHistory() {
      historyContent.innerHTML = '';
      chrome.storage.sync.get(['calcHistory'], function (result) {
        let calcHistory = result.calcHistory || [];
        calcHistory.forEach(entry => {
          let historyItem = document.createElement('div');
          historyItem.classList.add('history-item');
          historyItem.innerText = `${entry.calculation} (at ${entry.timestamp})`;
          historyItem.addEventListener('click', function () {
            currentCalculation = entry.calculation.split(' = ')[0];
            display.innerText = currentCalculation;
            resultDisplay.innerText = entry.calculation.split(' = ')[1];
            historyModal.style.display = 'none';
          });
          historyContent.appendChild(historyItem);
        });
      });
    }
  
    function updateResult() {
      try {
        if (isValidExpression(currentCalculation)) {
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
      const regex = /^\d+(\.\d+)?([\+\-\*\/]\d+(\.\d+)?)+$/;
      return regex.test(expression);
    }
  
    function isOperator(char) {
      return ['+', '-', '*', '/'].includes(char);
    }
  
    function calculate(expression) {
      try {
        expression = expression.replace(/\s+/g, '');
        if (!/^[\d+\-*/().]+$/.test(expression)) {
          throw new Error("Invalid characters in expression");
        }
        let result = evaluateExpression(expression);
        return result;
      } catch (e) {
        throw new Error("Invalid calculation");
      }
    }
  
    function evaluateExpression(expression) {
      let tokens = expression.match(/(\d+|\+|\-|\*|\/|\(|\))/g);
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
        }
      };
  
      for (let token of tokens) {
        if (!isNaN(token)) {
          values.push(parseFloat(token));
        } else if (token === '(') {
          operators.push(token);
        } else if (token === ')') {
          while (operators.length && operators[operators.length - 1] !== '(') {
            applyOperator();
          }
          operators.pop();
        } else if (token in operatorPrecedence) {
          while (operators.length &&
                 operatorPrecedence[operators[operators.length - 1]] >= operatorPrecedence[token]) {
            applyOperator();
          }
          operators.push(token);
        }
      }
  
      while (operators.length) {
        applyOperator();
      }
  
      return values[0];
    }
  
    function animateDisplay() {
      display.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        display.style.transform = 'translateY(0)';
      }, 200);
    }
  
    function openHistoryModal() {
      historyModal.style.display = 'block';
      loadHistory();
    }
  
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

    document.getElementById('convert-length').addEventListener('click', function () {
        let input = parseFloat(document.getElementById('length-input').value);
        let fromUnit = document.getElementById('length-from').value;
        let toUnit = document.getElementById('length-to').value;
        let result = convertLength(input, fromUnit, toUnit);
        document.getElementById('length-result').innerText = result;
      });
    
      function convertLength(value, from, to) {
        const conversions = {
          inches: { feet: 0.0833333, meters: 0.0254, kilometers: 0.0000254, miles: 0.0000157828 },
          feet: { inches: 12, meters: 0.3048, kilometers: 0.0003048, miles: 0.000189394 },
          meters: { inches: 39.3701, feet: 3.28084, kilometers: 0.001, miles: 0.000621371 },
          kilometers: { inches: 39370.1, feet: 3280.84, meters: 1000, miles: 0.621371 },
          miles: { inches: 63360, feet: 5280, meters: 1609.34, kilometers: 1.60934 }
        };
        if (from === to) return value;
        return value * (conversions[from][to] || 1);
      }
  });
  