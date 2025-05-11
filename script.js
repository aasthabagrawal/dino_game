import stringSimilarity from 'string-similarity';

export const processAlerts = (data) => {
  let open = 0;
  let closed = 0;

  const activeAlerts = new Set(); // alerts opened but not yet closed
  const finalUpdates = [];
  const everOpened = [];
  const unmatchedFinalUpdates = [];
  const discrepantAlerts = [];

  const noiseWords = new Set([
    'high', 'alert', 'final', 'update', 'reg', 'sc',
    'auto', 'automatically', 'initiated', 'cap', 'report', 'summary'
  ]);

  const getCoreWords = (title = '') => {
    return new Set(
      title
        .toLowerCase()
        .replace(/update\s*#?\d+.*$/i, '')
        .replace(/final update.*$/i, '')
        .replace(/\.[a-z]{2,5}\b/g, '')
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !noiseWords.has(word))
    );
  };

  const normalizeTitle = (title = '') => {
    return title
      .toLowerCase()
      .replace(/update\s*#?\d+.*$/i, '')
      .replace(/final update.*$/i, '')
      .replace(/\.[a-z]{2,5}\b/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const areTitlesEquivalent = (titleA, titleB) => {
    const cleanedA = normalizeTitle(titleA);
    const cleanedB = normalizeTitle(titleB);

    const sim = stringSimilarity.compareTwoStrings(cleanedA, cleanedB);
    if (sim >= 0.85) return true;

    const coreA = getCoreWords(titleA);
    const coreB = getCoreWords(titleB);
    const common = [...coreA].filter(word => coreB.has(word));
    const ratio = common.length / Math.min(coreA.size, coreB.size);

    return ratio >= 0.7;
  };

  // Extract alerts from response
  let alerts;
  if (data?.ResponseStatus?.alerts) {
    alerts = Array.isArray(data.ResponseStatus.alerts.alert)
      ? data.ResponseStatus.alerts.alert
      : [data.ResponseStatus.alerts.alert];
  } else if (Array.isArray(data)) {
    alerts = data;
  } else {
    console.warn("❌ No valid alert data found");
    return { open, closed, openTitles: [], unmatchedFinalUpdates, discrepantAlerts };
  }

  console.log("🔍 Starting Alert Processing...\n");

  // First pass: open alerts and collect finals
  alerts.forEach(alert => {
    const title = alert?.reportSummary?.title || alert?.title || '';
    if (!/high\s*alert/i.test(title)) return;

    const isFinal = /final update/i.test(title);
    const isIntermediate = /update\s*#?\d+/i.test(title) && !isFinal;

    const normalized = normalizeTitle(title);
    console.log(`[PASS 1] Title: "${title}"`);
    console.log(`         → Normalized: "${normalized}"`);
    console.log(`         → Type: ${isFinal ? 'FINAL' : isIntermediate ? 'INTERMEDIATE' : 'BASE'}`);

    if (isFinal) {
      finalUpdates.push(title);
    } else if (!isIntermediate) {
      const exists = [...activeAlerts].some(t => areTitlesEquivalent(t, title));
      if (!exists) {
        activeAlerts.add(title);
        everOpened.push(title);
        open++;
        console.log(`         ✅ Added to activeAlerts`);
      } else {
        console.log(`         🔁 Similar alert already tracked`);
      }
    } else {
      console.log(`         ⏭️ Skipped intermediate update`);
    }
  });

  console.log("\n🔄 Matching Final Updates...\n");

  // Second pass: match final updates
  finalUpdates.forEach(finalTitle => {
    const match = [...activeAlerts].find(openTitle =>
      areTitlesEquivalent(openTitle, finalTitle)
    );
    if (match) {
      activeAlerts.delete(match);
      closed++;
      open--;
      console.log(`✅ Final matched: "${finalTitle}" ↔ "${match}"`);
    } else {
      unmatchedFinalUpdates.push(finalTitle);
      discrepantAlerts.push({ type: 'UNMATCHED_FINAL_UPDATE', title: finalTitle });
      console.log(`❌ No match for final update: "${finalTitle}"`);
    }
  });

  // Add unmatched opens to discrepancies
  [...activeAlerts].forEach(title => {
    discrepantAlerts.push({ type: 'OPEN', title });
  });

  // Final summary
  console.log("\n📊 Final Summary:");
  console.log(`🔓 Currently Open Count: ${open}`);
  console.log(`✅ Closed Count: ${closed}`);
  console.log(`❌ Unmatched Final Updates Count: ${unmatchedFinalUpdates.length}`);
  console.log(`🧾 Active Open Alerts:`, [...activeAlerts]);
  console.log(`🚫 Unmatched Final Titles:`, unmatchedFinalUpdates);

  return {
    open,
    closed,
    openTitles: [...activeAlerts],
    allOpenTitles: everOpened,
    unmatchedFinalUpdates,
    discrepantAlerts,
  };
};

























export const processAlerts = (data) => {
  let open = 0;
  let closed = 0;

  const activeAlerts = new Set(); // alerts opened but not yet closed
  const finalUpdates = [];
  const everOpened = [];
  const unmatchedFinalUpdates = [];
  const discrepantAlerts = [];

  const noiseWords = new Set([
    'high', 'alert', 'final', 'update', 'reg', 'sc',
    'auto', 'automatically', 'initiated', 'cap', 'report', 'summary'
  ]);

  const getCoreWords = (title = '') => {
    return new Set(
      title
        .toLowerCase()
        .replace(/update\s*#?\d+.*$/i, '')         // Remove "update #1" and suffix
        .replace(/final update.*$/i, '')           // Remove "final update"
        .replace(/\.[a-z]{2,5}\b/g, '')            // Remove ".xyz" etc.
        .replace(/[^\w\s]/g, '')                   // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !noiseWords.has(word))
    );
  };

import stringSimilarity from 'string-similarity';

const areTitlesEquivalent = (titleA, titleB) => {
  const cleanedA = normalizeTitle(titleA);
  const cleanedB = normalizeTitle(titleB);

  const sim = stringSimilarity.compareTwoStrings(cleanedA, cleanedB);
  if (sim >= 0.85) return true;

  // Fallback to core word match if fuzzy fails
  const coreA = getCoreWords(titleA);
  const coreB = getCoreWords(titleB);

  const common = [...coreA].filter(word => coreB.has(word));
  const matchRatio = common.length / Math.min(coreA.size, coreB.size);

  return matchRatio >= 0.7; // tweak threshold
};


const normalizeTitle = (title = '') => {
  return title
    .toLowerCase()
    .replace(/update\s*#?\d+.*$/i, '')
    .replace(/final update.*$/i, '')
    .replace(/\.[a-z]{2,5}\b/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};


  // Extract alerts from response
  let alerts;
  if (data?.ResponseStatus?.alerts) {
    alerts = Array.isArray(data.ResponseStatus.alerts.alert)
      ? data.ResponseStatus.alerts.alert
      : [data.ResponseStatus.alerts.alert];
  } else if (Array.isArray(data)) {
    alerts = data;
  } else {
    console.warn("❌ No valid alert data found");
    return { open, closed, openTitles: [], unmatchedFinalUpdates, discrepantAlerts };
  }

  // First pass: find open alerts and collect final updates
  alerts.forEach(alert => {
    const title = alert?.reportSummary?.title || alert?.title || '';
    if (!/high\s*alert/i.test(title)) return;

    const isFinal = /final update/i.test(title);
    const isIntermediate = /update\s*#?\d+/i.test(title) && !isFinal;

    if (isFinal) {
      finalUpdates.push(title);
    } else if (!isIntermediate) {
      // Only count base alerts
      if (![...activeAlerts].some(t => areTitlesEquivalent(t, title))) {
        activeAlerts.add(title);
        everOpened.push(title);
        open++;
      }
    }
  });

  // Second pass: resolve final updates
  finalUpdates.forEach(finalTitle => {
    const match = [...activeAlerts].find(openTitle =>
      areTitlesEquivalent(openTitle, finalTitle)
    );
    if (match) {
      activeAlerts.delete(match);
      closed++;
      open--;
    } else {
      unmatchedFinalUpdates.push(finalTitle);
      discrepantAlerts.push({ type: 'UNMATCHED_FINAL_UPDATE', title: finalTitle });
    }
  });

  // Remaining active are unmatched open alerts
  [...activeAlerts].forEach(title => {
    discrepantAlerts.push({ type: 'OPEN', title });
  });

  return {
    open,
    closed,
    openTitles: [...activeAlerts],           // only currently open
    allOpenTitles: everOpened,               // everything ever opened
    unmatchedFinalUpdates,
    discrepantAlerts,
  };
};













import { get as levenshtein } from 'fast-levenshtein';

export const processAlerts = (data) => {
  let open = 0;
  let closed = 0;
  const THRESHOLD = 5;

  const openTitles = [];
  const unmatchedFinalUpdates = [];
  const discrepantAlerts = [];

  const alertMap = new Map();

  const normalizeTitle = (title = '') =>
  title
    .toLowerCase()
    .replace(/high alert/gi, '')        // remove constant prefix
    .replace(/reg sci/gi, '')           // remove noise/department
    .replace(/[\u2013\u2014\-:]+/g, '') // remove punctuation like hyphen, colon
    .replace(/final update.*$/i, '')
    .replace(/update\s+#?\d+.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();


  // Extract alerts
  let alerts;
  if (data?.ResponseStatus?.alerts) {
    alerts = Array.isArray(data.ResponseStatus.alerts.alert)
      ? data.ResponseStatus.alerts.alert
      : [data.ResponseStatus.alerts.alert];
  } else if (Array.isArray(data)) {
    alerts = data;
  } else {
    console.warn("❌ No valid alert data found");
    return { open, closed, openTitles, unmatchedFinalUpdates, discrepantAlerts };
  }

  if (!Array.isArray(alerts)) {
    console.warn("❌ Alerts is not a valid array");
    return { open, closed, openTitles, unmatchedFinalUpdates, discrepantAlerts };
  }

  // First pass: Build alertMap
  alerts.forEach((alert) => {
    const rawTitle = alert?.reportSummary?.title || alert?.title || '';
    if (!/high\s*alert/i.test(rawTitle)) return;

    const baseTitle = normalizeTitle(rawTitle);
    const isFinal = /final update/i.test(rawTitle);
    const isIntermediate = /update\s+#?\d+/i.test(rawTitle);

    if (!alertMap.has(baseTitle)) {
      alertMap.set(baseTitle, {
        hasBase: false,
        hasFinalUpdate: false,
        originalTitles: [],
      });
    }

    const entry = alertMap.get(baseTitle);
    entry.originalTitles.push(rawTitle);

    if (isFinal) {
      entry.hasFinalUpdate = true;
    } else if (!isIntermediate) {
      entry.hasBase = true;
    }
  });

  // Second pass: Analyze
  for (const [baseTitle, { hasBase, hasFinalUpdate }] of alertMap.entries()) {
    if (hasBase && hasFinalUpdate) {
      closed++;
    } else if (hasBase && !hasFinalUpdate) {
      open++;
      openTitles.push(baseTitle);
      discrepantAlerts.push({ type: 'OPEN', title: baseTitle });
    } else if (!hasBase && hasFinalUpdate) {
      // Try fuzzy match
      const match = [...alertMap.entries()].find(([candidateTitle, candidateData]) =>
        candidateData.hasBase &&
        levenshtein(baseTitle, candidateTitle) <= THRESHOLD
      );

      if (match) {
        closed++;
        console.log(`🤝 Fuzzy match: "${baseTitle}" ↔ "${match[0]}"`);
      } else {
        unmatchedFinalUpdates.push(baseTitle);
        discrepantAlerts.push({ type: 'UNMATCHED_FINAL_UPDATE', title: baseTitle });
      }
    }
  }

  console.log(`✅ Final counts — OPEN: ${open}, CLOSED: ${closed}`);

  return {
    open,
    closed,
    openTitles,
    unmatchedFinalUpdates,
    discrepantAlerts, // 🔥 Combined list to compare where logic fails
  };
};

















import { get as levenshtein } from 'fast-levenshtein';

export const processAlerts = (data) => {
  let open = 0;
  let closed = 0;
  const alertMap = new Map();
  const openTitles = [];
  const unmatchedFinalUpdates = [];
  const THRESHOLD = 5;

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
    console.warn("❌ No valid data found");
    return { open, closed, openTitles, unmatchedFinalUpdates };
  }

  if (!alerts || !Array.isArray(alerts)) {
    console.warn("❌ No valid alerts array found");
    return { open, closed, openTitles, unmatchedFinalUpdates };
  }

  console.log(`🔎 Total alerts fetched: ${alerts.length}`);

  // First pass: Build alert map with debug logs
  alerts.forEach((alertItem, index) => {
    const title = alertItem?.reportSummary?.title || alertItem?.title || '';
    if (!/high\s*alert/i.test(title)) {
      console.log(`⚠️ [${index}] Skipped non-high alert: "${title}"`);
      return;
    }

    const baseTitle = normalizeTitle(title);
    const isFinalUpdate = /final update/i.test(title);
    const isUpdate = /update\s+#?\d+/i.test(title);

    if (!alertMap.has(baseTitle)) {
      alertMap.set(baseTitle, { hasBase: false, hasFinalUpdate: false, originalTitles: [] });
    }

    const record = alertMap.get(baseTitle);
    record.originalTitles.push(title);

    if (isFinalUpdate) {
      record.hasFinalUpdate = true;
      console.log(`✅ [${index}] Found final update: "${title}" → base: "${baseTitle}"`);
    } else if (!isUpdate) {
      record.hasBase = true;
      console.log(`✅ [${index}] Found base alert: "${title}" → base: "${baseTitle}"`);
    } else {
      console.log(`ℹ️ [${index}] Ignored intermediate update: "${title}"`);
    }
  });

  // Second pass: Count open and closed, apply Levenshtein for final updates
  for (const [baseTitle, status] of alertMap.entries()) {
    if (status.hasBase && status.hasFinalUpdate) {
      closed++;
    } else if (status.hasBase && !status.hasFinalUpdate) {
      open++;
      openTitles.push(baseTitle);
      console.warn(`🔓 OPEN ALERT: "${baseTitle}" (no final update found)`);
    } else if (!status.hasBase && status.hasFinalUpdate) {
      // Try Levenshtein match
      const matchedTitle = [...alertMap.keys()].find(otherTitle => {
        return alertMap.get(otherTitle).hasBase &&
               levenshtein(baseTitle, otherTitle) <= THRESHOLD;
      });

      if (matchedTitle) {
        console.warn(`🤝 Fuzzy match: "${baseTitle}" matched to "${matchedTitle}"`);
        closed++;
      } else {
        unmatchedFinalUpdates.push(baseTitle);
        console.warn(`❗ UNMATCHED FINAL UPDATE: "${baseTitle}" (no close match found)`);
      }
    }
  }

  console.log(`✅ Final results — OPEN: ${open}, CLOSED: ${closed}`);
  return { open, closed, openTitles, unmatchedFinalUpdates };
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
