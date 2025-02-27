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




@app.route('/get_csv')
def get_csv():
    file_type = request.args.get('file')

    # Determine which file to fetch
    file_path = 'ipoinput.csv' if file_type == 'input' else 'ipooutput.csv' if file_type == 'output' else None

    if not file_path or not os.path.exists(file_path):
        return "<p style='color:red;'>CSV file not found</p>", 404

    try:
        # Load the CSV file
        df = pd.read_csv(file_path, encoding='windows-1252')

        # Standardize and clean column names
        df.columns = df.columns.str.strip().str.lower()

        # Ensure the 'IPO Date' column exists before sorting
        if 'ipo date' in df.columns:
            # Parse dates in the 'IPO Date' column
            df['ipo date'] = pd.to_datetime(df['ipo date'], format='%m/%d/%Y', errors='coerce')

            # Drop rows where 'IPO Date' couldn't be parsed
            df = df.dropna(subset=['ipo date'])       

            # Sort by IPO Date in descending order
            df = df.sort_values(by='ipo date', ascending=False)

            # Convert back to MM/DD/YYYY before returning
            df['ipo date'] = df['ipo date'].dt.strftime('%m/%d/%Y')

        # Add a "Submit" column only for the input file
        if file_type == 'input':
            df['Action'] = df.apply(lambda row: f"""
                <button onclick="triggerPreIPO('{row.to_json()}')">Submit</button>
            """, axis=1)


        # Return the DataFrame as an HTML table
        return df.to_html(classes='table table-striped', index=False,escape=False)
    
    except Exception as e:
        return f"<p style='color:red;'>Error reading CSV: {e}</p>", 500




from flask import jsonify
import json
import overmart  # Import the overmart module

@app.route('/trigger_preipo', methods=['POST'])
def trigger_preipo():
    try:
        row_data = request.get_json()  # Get row data as JSON
        row_dict = json.loads(row_data)  # Convert JSON string to dictionary

        # Pass the row data to the preipo function in overmart.py
        result = overmart.preipo(row_dict)

        return jsonify({"message": "PreIPO triggered successfully!", "result": result})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

function triggerPreIPO(rowData) {
    fetch('/trigger_preipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rowData // Send row data as JSON
    })
    .then(response => response.text())
    .then(data => alert(data))
    .catch(error => alert('Error triggering preIPO: ' + error));
}
def preipo(row):
    print("Processing PreIPO for:", row)
    return f"PreIPO process started for {row.get('symbol', 'Unknown')}"





