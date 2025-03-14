function setupWebSocket(route) {
  // Close any existing WebSocket connection
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
    socket.close();
  }

  // Reset the terminal
  term.reset();
  inputBuffer = "";

  term.write("Connecting to backend...\r\n");

  try {
    console.log(`Attempting to connect to: ws://${location.host}/${route}`);

    // Establish a new WebSocket connection with explicit protocols
    socket = new WebSocket(`ws://${location.host}/${route}`);

    console.log("WebSocket created, readyState:", socket.readyState);

    socket.onopen = () => {
      console.log("WebSocket connection opened successfully");
      term.write(
        "Connection established. Please enter your details below:\r\n"
      );

      // Remove the previous input handler, if any
      if (inputHandler) {
        // If your terminal library uses a different method, adjust this
        try {
          if (typeof inputHandler === "function") {
            // Some libraries use this pattern
            term.onData(inputHandler, true); // Remove the handler
          } else if (inputHandler.dispose) {
            // xterm.js uses this pattern
            inputHandler.dispose();
          }
        } catch (e) {
          console.error("Error removing input handler:", e);
        }
      }

      // Define the input handler
      const handleInput = (data) => {
        if (data === "\r") {
          console.log("Sending data:", inputBuffer);
          try {
            // Explicitly send as text
            socket.send(inputBuffer);
            console.log("Data sent successfully");
          } catch (e) {
            console.error("Error sending data:", e);
            term.write(`\r\nError sending data: ${e.message}\r\n`);
          }
          inputBuffer = "";
          term.write("\r\n");
        } else if (data === "\u007F") {
          if (inputBuffer.length > 0) {
            inputBuffer = inputBuffer.slice(0, -1);
            term.write("\b \b");
          }
        } else {
          inputBuffer += data;
          term.write(data);
        }
      };

      // Store the input handler - adapt this based on your terminal library
      inputHandler = term.onData(handleInput);
    };

    socket.onmessage = (event) => {
      console.log("Received message type:", typeof event.data);
      console.log("Received message:", event.data);

      try {
        term.write(event.data);
      } catch (e) {
        console.error("Error writing to terminal:", e);
        term.write(`\r\nError displaying message: ${e.message}\r\n`);
      }
    };

    socket.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      term.write(
        `\r\nConnection closed. Code: ${event.code}, Reason: ${
          event.reason || "None"
        }\r\n`
      );
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      term.write(`\r\nWebSocket Error: ${error}\r\n`);
    };
  } catch (error) {
    console.error("Connection setup error:", error);
    term.write(`\r\nFailed to connect: ${error.message}\r\n`);
  }
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





