@sock.route('/ws')
def websocket_handler(ws):
    try:
        # Step 1: Get name and Employee ID
        ws.send(">> Enter your name: ")
        name = ws.receive().strip()

        ws.send(">> Enter your employee ID: ")
        emp_id = ws.receive().strip()

        # Step 2: Start backend process
        process = subprocess.Popen(
            ["python", "backend.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Step 3: Send Name and Employee ID to Backend
        backend_input = f"{name},{emp_id}\n"
        process.stdin.write(backend_input)
        process.stdin.flush()

        # Step 4: Read backend response (until it asks for Y/N)
        while True:
            line = process.stdout.readline().strip()
            if line:
                ws.send(line + "\n")  # Send each output line to WebSocket
                ws.send(f"🔍 Debug: Received from backend -> {line}\n")
            if "Do you need the post IPO message? Type Y/N:" in line:
                break  # Backend is now expecting Y/N input

        # Step 5: Get user input for IPO message
        check = ws.receive().strip()
        ws.send(f"Received IPO input from WebSocket: {check}\n")  # Debug log
        process.stdin.write(f"{check}\n")
        process.stdin.flush()
        ws.send("Sent IPO input to backend.\n")

        # Step 6: Read remaining backend output
        while True:
            line = process.stdout.readline().strip()
            if line:
                ws.send(line + "\n")  # Send output to WebSocket
                ws.send(f"🔍 Debug: Backend output -> {line}\n")  # Debug log
                if "enter ipo:" in line.lower():  
                    break  # Wait until backend asks for IPO symbol

        ipo = ws.receive().strip()
        process.stdin.write(f"{ipo}\n")
        process.stdin.flush()

        while True:
            line = process.stdout.readline().strip()
            if line:
                ws.send(line + "\n")
                if "Enter user1: " in line:
                    break

        user1 = ws.receive().strip()
        ws.send(f"✅ Received user1 input: '{user1}'\n")  
        process.stdin.write(f"{user1}\n")
        process.stdin.flush()

        while True:
            line = process.stdout.readline().strip()
            if line:
                ws.send(line + "\n")  
                if "Enter user2:" in line:
                    break  

        # Step 11: Get `user2` input
        user2 = ws.receive().strip()
        ws.send(f"✅ Received user2 input: '{user2}'\n")  
        process.stdin.write(f"{user2}\n")
        process.stdin.flush()

            if process.poll() is not None:
                break  # Exit loop when the process ends

        # Step 7: Read and send errors (if any)
        error_output = process.stderr.read().strip()
        if error_output:
            ws.send(f"Error: {error_output}\n")

        # Close process properly
        process.stdin.close()
        process.stdout.close()
        process.stderr.close()
        process.wait()

    except Exception as e:
        ws.send(f"WebSocket Error: {str(e)}")

















@sock.route('/ws')
def websocket_handler(ws):
    try:
        # Step 1: Get name and Employee ID
        ws.send(">> Enter your name: ")
        name = ws.receive().strip()

        ws.send(">> Enter your employee ID: ")
        emp_id = ws.receive().strip()

        # Step 2: Start backend process
        process = subprocess.Popen(
            ["python", "backend.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Step 3: Send Name and Employee ID to Backend
        backend_input = f"{name},{emp_id}\n"
        process.stdin.write(backend_input)
        process.stdin.flush()

        # Step 4: Read backend response (until it asks for Y/N)
        while True:
            line = process.stdout.readline().strip()
            if line:
                ws.send(line + "\n")  # Send each output line to WebSocket
                ws.send(f"🔍 Debug: Received from backend -> {line}\n")
            if "Do you need the post IPO message? Type Y/N:" in line:
                break  # Backend is now expecting Y/N input

        # Step 5: Get user input for IPO message
        check = ws.receive().strip()
        ws.send(f"Received IPO input from WebSocket: {check}\n")  # Debug log
        process.stdin.write(f"{check}\n")
        process.stdin.flush()
        ws.send("Sent IPO input to backend.\n")

        # Step 6: Read remaining backend output
        while True:
            line = process.stdout.readline().strip()
            if line:
                ws.send(line + "\n")  # Send output to WebSocket
                ws.send(f"🔍 Debug: Backend output -> {line}\n")  # Debug log
                if "enter ipo:" in line.lower():  
                    break  # Wait until backend asks for IPO symbol

        ipo = ws.receive().strip()
        process.stdin.write(f"{ipo}\n")
        process.stdin.flush()

        while True:
            line = process.stdout.readline().stip()
            if line:
                ws.send(line + "\n")

            if process.poll() is not None:
                break  # Exit loop when the process ends

        # Step 7: Read and send errors (if any)
        error_output = process.stderr.read().strip()
        if error_output:
            ws.send(f"Error: {error_output}\n")

        # Close process properly
        process.stdin.close()
        process.stdout.close()
        process.stderr.close()
        process.wait()

    except Exception as e:
        ws.send(f"WebSocket Error: {str(e)}")


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





