# Neurons-Learning-Pong

I recently found out that scientists, including the Australian company Cortical Labs with their CL1 system, grow real human brain cells on a chip and teach them to play Pong. I wanted to see the idea in action, so I built a simple Pong game that visualizes it.

## The idea
In the real experiments, the neurons sit on a grid of tiny electrodes. The electrodes send signals in, such as where the ball is, and read the neurons' firing out to move the paddle. Nobody tells the cells what to do. When the paddle hits the ball, the cells get a calm, steady beat. When it misses, they get a burst of random noise. Neurons tend to settle into whatever makes their input predictable, so over time they get better at hitting.

This project is a **simulation** of that idea, not real cells. A small network of simulated neurons plays Pong the same way: a hit strengthens the connections that were just active, and a miss scrambles them. You can watch it improve as the rallies pile up. The learning rule is a tuned approximation, not an exact model of the real cells.

## Run it
Open `index.html` in a browser, or use the Live Server extension in VS Code.
