# Discretizing the Magnetic Induction Equation for 2D Solar Surface Flux Transport

In solar physics, understanding the evolution of the magnetic field on the photosphere is vital for predicting coronal structure and space weather events. On a macroscopic scale, the plasma behaves according to the laws of magnetohydrodynamics (MHD). 

This guide walks through the mathematical derivation and numerical discretization required to isolate and solve for the radial component of the magnetic field ({math}`B_r`) on a two-dimensional spherical shell. This is the underlying structural foundation for solar Surface Flux Transport (SFT) models.

---

## 1. The Vector Induction Equation

The time-evolution of a magnetic field {math}`\mathbf{B}` embedded within a plasma moving with a velocity field {math}`\mathbf{u}` is governed by the induction equation:

```{math}
\frac{\partial \mathbf{B}}{\partial t} = \nabla \times (\mathbf{u} \times \mathbf{B}) + \eta \nabla^2 \mathbf{B}
```

Where:
* {math}`\mathbf{u}` represents the macroscopic plasma flow velocity field (incorporating differential rotation, meridional circulation, and turbulent granulating flows).
* {math}`\eta` is the magnetic diffusivity coefficient ({math}`m^2/s`).
* {math}`\nabla \times (\mathbf{u} \times \mathbf{B})` is the advective-inductive plasma term.
* {math}`\eta \nabla^2 \mathbf{B}` represents the ohmic dissipation/diffusion term.

---

## 2. Spherical Shell Reduction (2D SFT Approximation)

To model the solar surface, we place our coordinate framework into a spherical coordinate system {math}`(r, \theta, \phi)`, where {math}`r` is radius, {math}`\theta` is colatitude (measured from the north pole), and {math}`\phi` is longitude. 

We apply three physical constraints unique to Surface Flux Transport setups:
1.  **Strictly Radial Field Focus:** We isolate the evolution at a fixed solar radius ({math}`r = R_{\odot}`). Thus, we only track the radial component {math}`B_r(\theta, \phi, t)`.
2.  **Purely Horizontal Surface Velocity:** The plasma velocity field near the photosphere is bounded to the horizontal surface, meaning {math}`u_r = 0`, leaving {math}`\mathbf{u} = (0, u_\theta, u_\phi)`.
3.  **Divergence-Free Field Condition:** The magnetic field must satisfy Maxwell's constraint: {math}`\nabla \cdot \mathbf{B} = 0`.

Expanding the vector advection term {math}`\nabla \times (\mathbf{u} \times \mathbf{B})` solely for its radial ({math}`\hat{\mathbf{r}}`) component under these geometric bounds yields the classic 2D advection equation on a sphere:

```{math}
\frac{\partial B_r}{\partial t} = -\frac{1}{R_{\odot}\sin\theta} \frac{\partial}{\partial \theta} \left( u_\theta B_r \sin\theta \right) - \frac{1}{R_{\odot}\sin\theta} \frac{\partial}{\partial \phi} \left( u_\phi B_r \right) + \eta \nabla^2_\Omega B_r
```

Where {math}`\nabla^2_\Omega` is the angular part of the Laplacian operator mapping over the surface of a sphere:

```{math}
\nabla^2_\Omega B_r = \frac{1}{R_{\odot}^2 \sin\theta} \frac{\partial}{\partial \theta} \left( \sin\theta \frac{\partial B_r}{\partial \theta} \right) + \frac{1}{R_{\odot}^2 \sin^2\theta} \frac{\partial^2 B_r}{\partial \phi^2}
```

---

## 3. Finite-Difference Numerical Grid Discretization

To solve this numerically on an HPC system, we construct an equi-angular staggered or centered mesh configuration. Let our grid be spaced uniformly by {math}`\Delta \theta` and {math}`\Delta \phi`, where index {math}`i` corresponds to colatitude {math}`\theta_i` and index {math}`j` corresponds to longitude {math}`\phi_j`.

### 3.1 Spatial Discretization of the Advective Terms
Using standard second-order central differences for the spatial derivatives helps mitigate numerical diffusion issues:

```{math}
\frac{\partial}{\partial \theta} [u_\theta B_r \sin\theta]_{i,j} \approx \frac{(u_\theta \sin\theta B_r)_{i+1,j} - (u_\theta \sin\theta B_r)_{i-1,j}}{2\Delta \theta}
```

```{math}
\frac{\partial}{\partial \phi} [u_\phi B_r]_{i,j} \approx \frac{(u_\phi B_r)_{i,j+1} - (u_\phi B_r)_{i,j-1}}{2\Delta \phi}
```

### 3.2 Spatial Discretization of the Diffusion Terms
The surface Laplacian terms are handled using standard three-point stencil approximations. To prevent grid-stretching, we define the directional midpoints cleanly:

```{math}
\sin\theta_{i \pm 1/2} = \sin\left(\frac{\theta_i + \theta_{i \pm 1}}{2}\right)
```

Evaluating the expansion yields our finite difference form:

```{math}
\frac{\partial}{\partial \theta} \left( \sin\theta \frac{\partial B_r}{\partial \theta} \right)_{i,j} \approx \frac{\sin\theta_{i+1/2}\left(\frac{B_{r, i+1, j} - B_{r, i, j}}{\Delta \theta}\right) - \sin\theta_{i-1/2}\left(\frac{B_{r, i, j} - B_{r, i-1, j}}{\Delta \theta}\right)}{\Delta \theta}
```

The longitudinal diffusion component resolves symmetrically:

```{math}
\frac{\partial^2 B_r}{\partial \phi^2}_{i,j} \approx \frac{B_{r, i, j+1} - 2B_{r, i, j} + B_{r, i, j-1}}{(\Delta \phi)^2}
```

---

## 4. Time Integration (FTCS and Stability Limits)

Using a Forward-Time Central-Space (FTCS) approach, the explicit temporal update for {math}`B_r` from timestep {math}`n` to {math}`n+1` can be expressed as:

```{math}
B_{r, i, j}^{n+1} = B_{r, i, j}^{n} + \Delta t \cdot \left[ \mathcal{A}_{i,j}^n + \mathcal{D}_{i,j}^n \right]
```

Where {math}`\mathcal{A}_{i,j}^n` represents the combined advective terms and {math}`\mathcal{D}_{i,j}^n` captures the diffusive updates derived in Section 3.

### Numerical Stability Constraints (The CFL Condition)
Because this formulation is explicit, your choice of {math}`\Delta t` is strictly limited to prevent exponential code explosion. The timestep must satisfy both the advective Courant-Friedrichs-Lewy (CFL) constraint and the diffusion stability constraint:

```{math}
\Delta t < \min \left( \frac{R_{\odot} \Delta \theta}{|u_\theta|}, \frac{R_{\odot} \sin\theta \Delta \phi}{|u_\phi|} \right)
```

And symmetrically for the localized surface diffusion stability framework:

```{math}
\Delta t < \frac{(\Delta \theta)^2 R_{\odot}^2}{4\eta}
```

> **Warning near the Poles:** As {math}`\theta \to 0` or {math}`\theta \to \pi` near the solar poles, the {math}`\sin\theta` term in the longitudinal CFL condition approaches zero. This forces {math}`\Delta t` to become vanishingly small, causing a severe computational bottleneck.

---

## 5. High-Performance C++ Implementation

Below is a highly optimized C++ loop designed for HPC deployment. It incorporates explicit OpenMP parallel threading over spatial rows to accelerate execution on multi-core Linux architectures.

```cpp
#include <iostream>
#include <vector>
#include <cmath>
#include <omp.h>

const double R_sun = 6.957e8; // Solar Radius in meters
const double PI = 3.14159265358979323846;

void update_magnetic_field(
    const std::vector<std::vector<double>>& Br_old,
    std::vector<std::vector<double>>& Br_new,
    const std::vector<std::vector<double>>& u_theta,
    const std::vector<std::vector<double>>& u_phi,
    double delta_theta, double delta_phi, double delta_t, double eta,
    int N_theta, int N_phi) 
{
    // Parallelize calculations across matrix rows using OpenMP
    #pragma omp parallel for collapse(2)
    for (int i = 1; i < N_theta - 1; ++i) {
        for (int j = 0; j < N_phi; ++j) {
            
            double theta = i * delta_theta;
            double sin_theta = std::sin(theta);
            
            // Handle periodic boundary wrapping conditions along longitude (phi)
            int j_plus  = (j + 1) % N_phi;
            int j_minus = (j - 1 + N_phi) % N_phi;
            
            // Midpoint helper evaluations for the radial diffusion operator
            double sin_p = std::sin(theta + 0.5 * delta_theta);
            double sin_m = std::sin(theta - 0.5 * delta_theta);

            // 1. Compute Advective Spatial Derivatives (Central Differences)
            double adv_theta = ((u_theta[i+1][j] * Br_old[i+1][j] * std::sin(theta + delta_theta)) - 
                                (u_theta[i-1][j] * Br_old[i-1][j] * std::sin(theta - delta_theta))) / (2.0 * delta_theta);
                                
            double adv_phi = (u_phi[i][j_plus] * Br_old[i][j_plus] - u_phi[i][j_minus] * Br_old[i][j_minus]) / (2.0 * delta_phi);
            
            double total_advection = -(adv_theta + adv_phi) / (R_sun * sin_theta);

            // 2. Compute Surface Diffusion Laplacians
            double diff_theta = (sin_p * (Br_old[i+1][j] - Br_old[i][j]) - sin_m * (Br_old[i][j] - Br_old[i-1][j])) / (delta_theta * delta_theta);
            double diff_phi = (Br_old[i][j_plus] - 2.0 * Br_old[i][j] + Br_old[i][j_minus]) / (delta_phi * delta_phi);
            
            double total_diffusion = eta * ((diff_theta / (R_sun * R_sun * sin_theta)) + 
                                            (diff_phi / (R_sun * R_sun * sin_theta * sin_theta)));

            // 3. Temporal Advance (Explicit Euler Update Step)
            Br_new[i][j] = Br_old[i][j] + delta_t * (total_advection + total_diffusion);
        }
    }
    
    // Boundary conditions for the poles (i = 0 and i = N_theta - 1) are updated separately 
    // using azimuthal averages to ensure numerical stability.
}
```