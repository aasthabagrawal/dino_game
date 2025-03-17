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
            ["python", "-u", "backend.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        # Step 3: Send Name and Employee ID to Backend
        backend_input = f"{name},{emp_id}\n"
        process.stdin.write(backend_input)
        process.stdin.flush()
        
        while True:  # Iterative loop for multiple IPO checks
            # Step 4: Read backend response until IPO confirmation prompt
            while True:
                line = process.stdout.readline().strip()
                if line:
                    ws.send(line + "\n")
                if "Do you need to post ipo message? Type Y/N:" in line:
                    break  # Backend is now expecting Y/N input
            
            # Check if process ended
            if process.poll() is not None:
                break
                
            # Step 5: Get IPO confirmation input (loop until valid input)
            while True:
                check = ws.receive().strip().upper()
                if check in ["Y", "YES", "N", "NO"]:
                    process.stdin.write(f"{check}\n")
                    process.stdin.flush()
                    break  # Valid input, exit loop
                else:
                    ws.send("Invalid input. Please type Y or N.\n")
            
            if check in ["N", "NO"]:
                # Wait for upload_csv() to complete
                while True:
                    line = process.stdout.readline().strip()
                    if line:
                        ws.send(line + "\n")
                    if process.poll() is not None:
                        break
                break  # Exit main loop
            
            # Step 6: Wait for backend to ask for IPO
            while True:
                line = process.stdout.readline().strip()
                if line:
                    ws.send(line + "\n")
                if "enter ipo:" in line:
                    break  # Backend is now expecting IPO input
            
            # Step 7: Get IPO input
            ipo = ws.receive().strip()
            process.stdin.write(f"{ipo}\n")
            process.stdin.flush()
            
            # Step 8: Read response until backend function starts
            while True:
                line = process.stdout.readline().strip()
                if not line and process.poll() is not None:
                    break
                if line:
                    ws.send(line + "\n")
                if "HELLO" in line:
                    break  # Backend function `result(ipo)` has started
            
            # Step 9: Get user input
            ws.send(">> Enter user1: ")
            user1 = ws.receive().strip()
            
            ws.send(">> Enter user2: ")
            user2 = ws.receive().strip()
            
            ws.send(">> Enter user3: ")
            user3 = ws.receive().strip()
            
            # Step 10: Send user inputs to backend
            process.stdin.write(f"{user1},{user2},{user3}\n")
            process.stdin.flush()
        
        # Step 11: Read any remaining backend responses
        while True:
            line = process.stdout.readline().strip()
            if line:
                ws.send(line + "\n")
            if process.poll() is not None:
                break
        
        # Step 12: Read any error messages
        error_output = process.stderr.read().strip()
        if error_output:
            ws.send(f"Error: {error_output}\n")
        
        # Close process properly
        process.stdin.close()
        process.stdout.close()
        process.stderr.close()
        process.wait()
    
    except Exception as e:
        ws.send(f"WebSocket Error: {str(e)}\n")
