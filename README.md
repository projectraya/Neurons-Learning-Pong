# Dish Pong

Pong played by a small simulated network of neurons, inspired by Cortical Labs' CL1 / DishBrain.
A hit gives a calm, steady beat. A miss gives a burst of random noise. The network learns from that.

## Run it
- Easiest: double-click `index.html`.
- Or in VS Code: install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server".

## Test the learning (needs Node.js)
    node test.js 30 3000

Prints the hit rate in blocks over 3000 rallies for 4 fresh brains. It should climb.

## Files
- `src/dish.js`  the brain and game logic (no browser code, so it can be tested in Node)
- `src/main.js`  drawing, controls and sound
- `style.css`    page styling
