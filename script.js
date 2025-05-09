export const processAlerts = (data) => {
  let open = 0;
  let closed = 0;
  const alertMap = new Map();

  const normalizeTitle = (title = '') => {
    return title
      .toLowerCase()
      .replace(/[\u2013\u2014-]\s*(final update.*|update\s+#?\d+.*)$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Extract alerts
  let alerts;
  if (data?.ResponseStatus?.alerts) {
    alerts = Array.isArray(data.ResponseStatus.alerts.alert)
      ? data.ResponseStatus.alerts.alert
      : [data.ResponseStatus.alerts.alert];
  } else if (Array.isArray(data)) {
    alerts = data;
  } else {
    console.warn("No valid data found");
    return { open, closed };
  }

  if (!alerts || !Array.isArray(alerts)) {
    console.warn("No valid alerts array found");
    return { open, closed };
  }

  // First pass: Build alert map
  alerts.forEach((alertItem) => {
    const title = alertItem?.reportSummary?.title || alertItem?.title || '';
    if (!/high\s*alert/i.test(title)) return;

    const baseTitle = normalizeTitle(title);
    const isFinalUpdate = /final update/i.test(title);

    if (!alertMap.has(baseTitle)) {
      alertMap.set(baseTitle, { hasBase: false, hasFinalUpdate: false });
    }

    const record = alertMap.get(baseTitle);
    if (isFinalUpdate) {
      record.hasFinalUpdate = true;
    } else if (!/update\s+#?\d+/i.test(title)) {
      record.hasBase = true;
    }
  });

  // Second pass: Count open and closed
  for (const [baseTitle, status] of alertMap.entries()) {
    if (status.hasBase && status.hasFinalUpdate) {
      closed++;
    } else if (status.hasBase) {
      open++;
    }
  }

  console.log(`Final results - open: ${open}, closed: ${closed}`);
  return { open, closed };
};









@app.route('/add_csv_row', methods=['POST'])
def add_csv_row():
    try:
        data = request.get_json()
        label = data.get('file')
        new_row = data.get('new_row')  # ← this was missing

        file_path = {
            'input': 'ipoinput.csv',
            'output': 'ipooutput.csv'
        }.get(label)

        if not file_path or not os.path.exists(file_path):
            return jsonify({'success': False, 'message': 'File not found'}), 404

        df = pd.read_csv(file_path, encoding='windows-1252')
        df.columns = df.columns.str.strip().str.lower()

        # Ensure keys match columns
        new_row_cleaned = {k.lower().strip(): v for k, v in new_row.items()}
        new_row_series = pd.Series(new_row_cleaned)

        df = pd.concat([df, pd.DataFrame([new_row_series])], ignore_index=True)
        df.to_csv(file_path, index=False, encoding='windows-1252')

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500



const headerCells = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim().toLowerCase());

  // Add "Actions" header if not already added
const theadRow = table.querySelector('thead tr');
const actionsHeader = document.createElement('th');
actionsHeader.textContent = 'Actions';
actionsHeader.style.textAlign = 'center';

const addBtn = document.createElement('button');
addBtn.className = 'btn btn-add';
addBtn.textContent = 'Add New Row';
addBtn.style.color='white';
addBtn.style.border=2;
addBtn.style.backgroundColor='red';
addBtn.onclick = () => addNewInlineRow(headerCells, table);

actionsHeader.appendChild(document.createElement('br')); // line break
actionsHeader.appendChild(addBtn);
theadRow.appendChild(actionsHeader);

  const rows = table.querySelectorAll('tbody tr');
  if(currentFile=='input'){
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const rowData = {};

    // Dynamically map row data based on headers
    headerCells.forEach((header, index) => {
      rowData[header] = cells[index]?.textContent.trim();
    });

    // Create Edit/Delete buttons







       function addNewInlineRow(headerCells, table) {
  const tbody = table.querySelector('tbody');
  const newRow = document.createElement('tr');

  // Create editable cells for each column
  headerCells.forEach(col => {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = col;
    input.className = 'inline-input';
    td.appendChild(input);
    newRow.appendChild(td);
  });

  // Action buttons: Save + Cancel
  const actionTd = document.createElement('td');
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.className = 'btn btn-save';
  saveBtn.onclick = () => {
    const inputs = newRow.querySelectorAll('input');
    const newRowData = {};
    headerCells.forEach((col, idx) => {
      newRowData[col] = inputs[idx].value.trim();
    });

    // Call backend to add this row
    fetch('/add_csv_row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: currentFile,
        new_row: newRowData
      })
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        updateTable();  // Refresh the table
      } else {
        alert('Error adding row: ' + result.message);
      }
    })
    .catch(err => {
      alert('Request failed: ' + err);
    });
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'btn btn-cancel';
  cancelBtn.onclick = () => newRow.remove();

  actionTd.appendChild(saveBtn);
  actionTd.appendChild(cancelBtn);
  newRow.appendChild(actionTd);

  tbody.appendChild(newRow);
}















@app.route('/delete_csv_row', methods=['POST'])
def delete_csv_row():
    try:
        # Get the request data
        data = request.get_json()
        file_path = data.get('file')
        row_data = data.get('rowData')

        # Validate input
        if not file_path or not row_data:
            return jsonify({'success': False, 'message': 'Invalid input'}), 400

        # Read the CSV file
        df = pd.read_csv(file_path, encoding='windows-1252')
        
        # Standardize column names
        df.columns = df.columns.str.strip().str.lower()

        # Find and remove the matching row
        # This approach tries to match all provided key-value pairs
        mask = pd.Series(True, index=df.index)
        for key, value in row_data.items():
            # Handle case-insensitive column names and string comparisons
            key = key.lower().strip()
            if key in df.columns:
                mask &= (df[key].astype(str) == str(value))
        
        # Remove the matching row(s)
        df_filtered = df[~mask]

        # Save the updated DataFrame back to CSV
        df_filtered.to_csv(file_path, index=False, encoding='windows-1252')

        return jsonify({'success': True})

    except Exception as e:
        print(f"Error deleting row: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500



@app.route('/edit_csv_row', methods=['POST'])
def edit_csv_row():
    try:
        # Get the request data
        data = request.get_json()
        file_path = data.get('file')
        row_identifier = data.get('row_identifier')  # How to identify the row
        updated_data = data.get('updated_data')      # New data for the row
        
        # Validate input
        if not file_path or not row_identifier or not updated_data:
            return jsonify({'success': False, 'message': 'Invalid input'}), 400
        
        # Read the CSV file
        df = pd.read_csv(file_path, encoding='windows-1252')
        
        # Standardize column names
        df.columns = df.columns.str.strip().str.lower()
        
        # Find the row to edit
        mask = pd.Series(True, index=df.index)
        for key, value in row_identifier.items():
            key = key.lower().strip()
            if key in df.columns:
                mask &= (df[key].astype(str) == str(value))
        
        # Update the row with new data
        if mask.any():
            for key, value in updated_data.items():
                key = key.lower().strip()
                if key in df.columns:
                    df.loc[mask, key] = value
            
            # Save the updated DataFrame back to CSV
            df.to_csv(file_path, index=False, encoding='windows-1252')
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Row not found'}), 404
            
    except Exception as e:
        print(f"Error editing row: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

 .btn{
    padding: 6px 12px;
    margin-right: 8px;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
  }

  .btn-edit {
    background-color: #007BFF; /* blue */
  }
  
  .btn-delete {
    background-color: purple; /* red */
  }

  .btn-save{
    background-color: #007BFF;
  }

  .btn-cancel{
    background-color: #28a745;
  }



 function updateTable() {
      if (!currentFile) return;

      fetch(`/get_csv?file=${currentFile}`)
        .then(response => response.text())
        .then(data => {
          let displayDiv = document.getElementById('csv_display');

          displayDiv.innerHTML = data;
          displayDiv.style.display = 'block';
          
          setTimeout(() => {
  updateRecordCount();

  if (currentFile === 'output') {
    addSymbolFilter();
    addDateFilter();
  }

  const displayDiv = document.getElementById('csv_display');
  const table = displayDiv.querySelector('table');
  if (!table) return;

  const headerCells = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim().toLowerCase());
  const rows = table.querySelectorAll('tbody tr');
  if(currentFile=='input'){
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const rowData = {};

    // Dynamically map row data based on headers
    headerCells.forEach((header, index) => {
      rowData[header] = cells[index]?.textContent.trim();
    });

    // Create Edit/Delete buttons
    
    const actionTd = document.createElement('td');
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-edit';
    editButton.textContent = 'Edit';
    editButton.setAttribute('data-row', JSON.stringify(rowData));
    editButton.onclick = () => editRow(editButton);
    
    actionTd.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('data-row', JSON.stringify(rowData));
    deleteButton.onclick = () => deleteRow(deleteButton);
    actionTd.appendChild(deleteButton);

    row.appendChild(actionTd);
  });
  }
}, 100);
        
        })
      
        .catch(error => {
          document.getElementById('csv_display').innerHTML = `<p style="color:red;">Error loading data: ${error}</p>`;
          document.getElementById('record_count').textContent = '0';
        });
    }

    function deleteRow(button) {
    const rowData = JSON.parse(button.getAttribute('data-row'));

    // Send delete request to the server
    fetch('/delete_csv_row', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            file: 'ipoinput.csv',
            rowData: rowData
        })
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            // Remove the row from the table
            button.closest('tr').remove();
            
            // Update record count
            updateRecordCount();
        } else {
            alert('Failed to delete row: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the row');
    });
}
window.deleteRow = deleteRow;






function editRow(button) {
  const row = button.closest('tr');
  const rowData = JSON.parse(button.getAttribute('data-row'));

  // Disable the Edit button while editing
  button.disabled = true;
  button.textContent = 'Editing...';

  const cells = row.querySelectorAll('td');
  const inputFields = [];

  // Replace each cell (except last one with buttons) with input fields
  Object.entries(rowData).forEach(([key, value], index) => {
    const cell = cells[index];
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.style.width = '100%';
    cell.innerHTML = '';
    cell.appendChild(input);
    inputFields.push({ key, input });
  });

  // Replace buttons with Save + Cancel
  const actionTd = cells[cells.length - 1];
  actionTd.innerHTML = '';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-save';
  saveBtn.textContent = 'Save';
  saveBtn.onclick = () => {
    const updatedData = {};
    inputFields.forEach(({ key, input }) => {
      updatedData[key] = input.value;
    });

    fetch('/edit_csv_row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: 'ipoinput.csv',
        row_identifier: rowData,
        updated_data: updatedData
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Row updated successfully!');
        fetchCSV(currentFile); // reload table
      } else {
        alert('Failed to update row: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Edit error:', error);
      alert('An error occurred while editing the row');
    });
  };

  const cancelBtn = document.createElement('button');

  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'btn btn-cancel';
  cancelBtn.onclick = () => {
    fetchCSV(currentFile); // reload to reset
  };

  actionTd.appendChild(saveBtn);
  actionTd.appendChild(cancelBtn);
}



















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
