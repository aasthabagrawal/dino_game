const dino = document.getElementById("dino");
const rock = document.getElementById("rock");
const score = document.getElementById("score");

function jump() {
  dino.classList.add("jump-animation");
  setTimeout(() =>
    dino.classList.remove("jump-animation"), 500);
}

document.addEventListener('keypress', (event) => {
  if (!dino.classList.contains('jump-animation')) {
    jump();
  }
})

setInterval(() => {
  const dinoTop = parseInt(window.getComputedStyle(dino)
    .getPropertyValue('top'));
  const rockLeft = parseInt(window.getComputedStyle(rock)
    .getPropertyValue('left'));
  score.innerText++;

  if (rockLeft < 0) {
    rock.style.display = 'none';
  } else {
    rock.style.display = ''
  }

  if (rockLeft < 50 && rockLeft > 0 && dinoTop > 150) {
    alert("You got a score of: " + score.innerText +
      "\n\nPlay again?");
    location.reload();
  }
}, 50);










@app.route('/preipo', methods=['POST'])
def handle_preipo():
    try:
        data = request.json
        row_data = data.get('rowData')
        
        # Split the CSV row into individual fields
        fields = row_data.split(',')
        
        # Call your preipo function with the appropriate parameters
        # You'll need to modify this to match your actual function signature
        result = preipo(*fields)  # Pass the fields as separate arguments
        
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


function updateTable() {
  if (!currentFile) return;

  fetch(`/get_csv?file=${currentFile}`)
    .then(response => response.text())
    .then(data => {
      let displayDiv = document.getElementById('csv_display');
      
      // Process the CSV data to add submit buttons if it's an input file
      if (currentFile === 'input') {
        // Convert the CSV text to HTML table with submit buttons
        const rows = data.split('\n');
        let tableHTML = '<table border="1">';
        
        // Process header row
        const headerCells = rows[0].split(',');
        tableHTML += '<tr>';
        headerCells.forEach(cell => {
          tableHTML += `<th>${cell.trim()}</th>`;
        });
        tableHTML += '<th>Action</th></tr>'; // Add header for button column
        
        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].trim() === '') continue; // Skip empty rows
          
          const rowCells = rows[i].split(',');
          tableHTML += '<tr>';
          rowCells.forEach(cell => {
            tableHTML += `<td>${cell.trim()}</td>`;
          });
          
          // Add submit button with rowData as parameter
          tableHTML += `<td><button onclick="submitToPreIPO('${encodeURIComponent(rows[i])}')">Submit</button></td></tr>`;
        }
        
        tableHTML += '</table>';
        displayDiv.innerHTML = tableHTML;
      } else {
        // For other files, just display as is
        displayDiv.innerHTML = data;
      }
      
      displayDiv.style.display = 'block';
      
      setTimeout(() => {
        updateRecordCount();

        if (currentFile === 'output') {
          addSymbolFilter();
          addDateFilter();
        }
      }, 100);
    })
    .catch(error => {
      document.getElementById('csv_display').innerHTML = `<p style="color:red;">Error loading data: ${error}</p>`;
      document.getElementById('record_count').textContent = '0';
    });
}

// Function to handle the submit button click
function submitToPreIPO(rowData) {
  // Decode the URL-encoded row data
  const decodedData = decodeURIComponent(rowData);
  
  // Make an AJAX call to your Python function
  fetch('/preipo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rowData: decodedData }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Submission successful!');
      // Optionally refresh the table after successful submission
      updateTable();
    } else {
      alert('Error: ' + data.error);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred during submission.');
  });
}










