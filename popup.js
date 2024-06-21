document.addEventListener('DOMContentLoaded', function () {
    let display = document.getElementById('calc-display');
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
          currentCalculation += value;
          display.innerText = currentCalculation;
        } else if (this.id === 'equals') {
          try {
            console.log('Current Calculation:', currentCalculation);
            let result = calculate(currentCalculation);
            console.log('Result:', result);
            if (isNaN(result) || !isFinite(result)) throw new Error("Result is not a valid number");
            saveToHistory(currentCalculation + ' = ' + result);
            display.innerText = result;
            currentCalculation = result.toString();
          } catch (e) {
            console.error('Error during calculation:', e);
            display.innerText = 'Error';
            currentCalculation = '';
          }
        } else if (this.id === 'clear') {
          currentCalculation = '';
          display.innerText = '0';
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
            historyModal.style.display = 'none';
          });
          historyContent.appendChild(historyItem);
        });
      });
    }
  
    function openHistoryModal() {
      loadHistory();
      historyModal.style.display = 'block';
    }
  
    // Simple arithmetic parser
    function calculate(expression) {
      try {
        // Remove all whitespace
        expression = expression.replace(/\s+/g, '');
        // Validate the expression (only contains numbers and allowed operators)
        if (!/^[\d+\-*/().]+$/.test(expression)) {
          throw new Error("Invalid characters in expression");
        }
        // Implement the calculation logic
        let result = evaluateExpression(expression);
        return result;
      } catch (e) {
        throw new Error("Invalid calculation");
      }
    }
  
    function evaluateExpression(expression) {
      // Split the expression into tokens
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
  