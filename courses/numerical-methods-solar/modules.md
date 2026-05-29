## Weekly Curricular Stencil

### Module 1: The Solar Fabric and Grid Discretization
* **Solar Concept:** Anatomy of the solar atmosphere (Photosphere to Corona) and the necessity of numerical modeling due to non-linear plasma behaviors.
* **Numerical Theory:** Discretizing continuous space and time. Introduction to Taylor series expansions, truncation errors, and Finite Difference Representations (Forward, Backward, and Central differences).
* **Lab Work:** Writing a basic script to numerically take the spatial derivative of an observed photospheric magnetic field profile.

### Module 2: Thermal Transport and Parabolic PDEs
* **Solar Concept:** The Coronal Heating Problem and energy transport via field-aligned thermal conduction in coronal loops.
* **Numerical Theory:** Parabolic Partial Differential Equations (PDEs). The FTCS (Forward-Time Central-Space) explicit scheme. Understanding numerical instability and deriving the CFL Condition for diffusion.
* **Lab Work:** Simulating the thermal cooling of a post-flare coronal loop over time.

### Module 3: Advection, Solar Wind, and Hyperbolic PDEs
* **Solar Concept:** Hydrodynamic expansion of the solar corona and Parker’s classical solar wind model.
* **Numerical Theory:** Hyperbolic conservation laws. The failure of naïve FTCS schemes on advection problems. Introduction to stable upwind schemes and the Lax-Friedrichs numerical flux method.
* **Lab Work:** Coding an advection solver to track a localized density perturbation riding out along a steady solar wind stream.

### Module 4: Magnetic Induction and Plasma Stencils
* **Solar Concept:** The Solar Dynamo, differential rotation, and the tracking of surface magnetic flux transport (SFT).
* **Numerical Theory:** Operator splitting techniques. Implementing 2D spatial stencils and evaluating artificial numerical diffusion versus real physical magnetic resistivity.
* **Lab Work:** Simulating how a clean dipolar magnetic patch gets sheared into a toroidal configuration by equatorial solar differential rotation.
