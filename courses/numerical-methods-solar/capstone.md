## Project Lab: Modeling Parker's Hydrodynamic Solar Wind Expansion

Students solve a simplified, isothermal, 1D hydrodynamic continuity equation representing plasma accelerating outward from the solar corona under the influence of gravity using a stable Lax-Friedrichs discretization scheme to observe numerical dispersion and CFL constraints.

$$\frac{\partial \rho}{\partial t} + \frac{1}{r^2}\frac{\partial}{\partial r}\left(r^2 \rho u\right) = 0$$

### Student Source Laboratory Blueprint

```python
import numpy as np
import matplotlib.pyplot as plt

# Grid Setup and Physical Parameters
N_r = 200; R_sun = 6.96e8
r = np.linspace(1.0 * R_sun, 10.0 * R_sun, N_r); dr = r[1] - r[0]
u = 200e3 * (r / (1.0 * R_sun))**0.5  # Acceleration profile
dt = 0.4 * (dr / np.max(u)); time_steps = 150

# Initial Conditions (Background + Plasma Plume)
rho = (1.0 / (r / R_sun)**2) + 5.0 * np.exp(-((r - 2.0*R_sun)/(0.3*R_sun))**2)
rho_initial = rho.copy()

# Lax-Friedrichs Time Integration Loop
for n in range(time_steps):
    rho_new = rho.copy(); flux = (r**2) * rho * u
    for i in range(1, N_r - 1):
        dflux_dr = (flux[i+1] - flux[i-1]) / (2.0 * dr)
        rho_new[i] = 0.5 * (rho[i+1] + rho[i-1]) - dt * (1.0 / r[i]**2) * dflux_dr
    rho_new[0] = rho_new[1]; rho_new[-1] = rho_new[-2]; rho = rho_new.copy()

# Plot Results
plt.figure(figsize=(8, 4))
plt.plot(r / R_sun, rho_initial, 'r--', label='Initial Configuration')
plt.plot(r / R_sun, rho, 'b-', label='Evolved Simulation Profile')
plt.xlabel('Radial Distance ($R_\\odot$)'); plt.ylabel('Density (\\rho)'); plt.legend(); plt.show()
