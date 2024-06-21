document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get(['calcHistory'], function (result) {
      let calcHistory = result.calcHistory || [];
      if (calcHistory.length > 0) {
        loadHistory();
      }
    });
  
    function loadHistory() {
      let historyContent = document.getElementById('history-content');
      historyContent.innerHTML = '';
      chrome.storage.sync.get(['calcHistory'], function (result) {
        let calcHistory = result.calcHistory || [];
        calcHistory.forEach(entry => {
          let historyItem = document.createElement('div');
          historyItem.classList.add('history-item');
          historyItem.innerText = `${entry.calculation} (at ${entry.timestamp})`;
          historyItem.addEventListener('click', function () {
            let display = document.getElementById('calc-display');
            display.innerText = entry.calculation.split(' = ')[0];
            document.getElementById('history-modal').style.display = 'none';
          });
          historyContent.appendChild(historyItem);
        });
      });
    }
  });
  