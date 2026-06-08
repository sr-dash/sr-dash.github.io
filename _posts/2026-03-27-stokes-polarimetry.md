---
layout: post
title: "Measuring Magnetic Fields in the Solar Corona: From Stokes Polarimetry to Magnetic Field Inversions"
date: 2026-06-08
category: concepts
tags: [Coronal Magnetism, Fe XIII, Stokes Parameters, Zeeman Effect, CryoNIRSP, DKIST, Polarimetry]
excerpt: "How solar physicists transform faint coronal polarization signals into quantitative maps of magnetic field strength using spectropolarimetry, inversion techniques, and the Fe XIII 1074.7 nm forbidden emission line."
---

# Measuring Magnetic Fields in the Solar Corona: From Stokes Polarimetry to Magnetic Field Inversions

The solar corona is one of the most magnetically dominated environments in the Solar System. Coronal magnetic fields guide plasma flows, power solar eruptions, and ultimately drive space weather throughout the heliosphere.

Yet measuring these magnetic fields remains one of the most challenging observational problems in modern astronomy.

Unlike the bright solar photosphere, the corona is both **optically thin** and **extremely faint**, often millions of times dimmer than the solar disk itself. Consequently, conventional imaging alone cannot reveal the underlying magnetic structure. Instead, researchers must extract magnetic information from the polarization state of coronal emission lines.

The most powerful diagnostic currently available is the forbidden infrared emission line of ionized iron,

$$
\mathrm{Fe,XIII}\ 1074.7\ {\rm nm},
$$

which carries signatures of both the coronal magnetic field geometry and strength.

Transforming these faint, noise-dominated signals into quantitative magnetic field maps requires a combination of careful calibration, spectral line fitting, and mathematical inversion techniques.

---

## Reading the Corona Through Polarized Light

The complete polarization state of light is described by the four **Stokes Parameters**:

$$
(I, Q, U, V).
$$

Each parameter carries distinct physical information:

* **Stokes (I)** — Total intensity.
* **Stokes (Q) and (U)** — Linear polarization.
* **Stokes (V)** — Circular polarization.

For the Fe XIII infrared line, magnetic information is encoded through two complementary physical mechanisms.

---

## Scattering Polarization: Tracing the Plane-of-Sky Field

The linear polarization components ((Q) and (U)) arise primarily through **anisotropic radiative excitation**, often referred to as scattering polarimetry.

The process begins when photospheric radiation illuminates coronal iron ions. Because the radiation field is anisotropic, magnetic sublevels within the ion become unevenly populated.

When these excited ions spontaneously decay, they emit linearly polarized photons.

The orientation of the resulting polarization vector reveals the projected direction of the local magnetic field in the plane of the sky.

Consequently, measurements of (Q) and (U) provide crucial information about the **transverse magnetic field geometry** throughout the corona.

---

## The Zeeman Effect: Measuring the Line-of-Sight Field

The circular polarization signal ((V)) originates from the **Zeeman Effect**.

In the presence of a magnetic field, atomic energy levels split into multiple magnetic sublevels. This causes the spectral line to separate into polarized components with slightly different wavelengths.

The characteristic Zeeman splitting is

$$
\Delta\lambda_Z \propto g_{\rm eff},\lambda_0^2,B,
$$

where

* (g_{\rm eff}) is the effective Landé factor,
* (\lambda_0) is the rest wavelength,
* (B) is the magnetic field strength.

For typical coronal magnetic fields between

$$
1\ {\rm G} \lesssim B \lesssim 100\ {\rm G},
$$

the splitting is far smaller than the thermal width of the spectral line.

Although the individual components cannot be resolved directly, they produce a subtle anti-symmetric circular polarization signature in the Stokes (V) profile.

This signature provides a measurement of the **longitudinal magnetic field component**, (B_\parallel).

---

## The Data Reduction Pipeline

Before magnetic field information can be extracted, the raw observations must undergo extensive calibration.

The data reduction process removes instrumental artifacts, atmospheric contamination, and background signals that would otherwise overwhelm the weak coronal polarization measurements.

### 1. Straylight and Occulter Scatter Correction

The corona is approximately

$$
10^{-5} - 10^{-6}
$$

times fainter than the solar disk.

Even small amounts of scattered light from the atmosphere or telescope optics can dominate the observed signal.

Modern coronagraphic instruments employ occulting disks to block direct sunlight. Residual scattered light is then modeled using off-limb observations and subtracted from the data.

---

### 2. Telluric Absorption Removal

At infrared wavelengths near

$$
1074.7\ {\rm nm},
$$

Earth's atmosphere introduces narrow absorption features produced primarily by water vapor and carbon dioxide.

These telluric lines distort the observed coronal spectrum.

To recover the intrinsic line shape, observations are corrected using atmospheric transmission models or reference measurements obtained under similar observing conditions.

---

### 3. Continuum Subtraction

The observed spectrum contains contributions from:

* Instrumental thermal emission
* Scattered photospheric light
* K-coronal continuum emission

A low-order polynomial is fitted to wavelength regions outside the emission line and subsequently removed, isolating the pure Fe XIII spectral profile.

---

### 4. Doppler and Slit Alignment Corrections

Coronal plasma motions introduce Doppler shifts that displace the line center.

Instrumental alignment imperfections may additionally produce artificial velocity gradients across the detector.

A preliminary centroid analysis determines these systematic shifts and maps the data onto a common wavelength reference frame.

---

### 5. Spectral Profile Fitting

Once calibrated, the Stokes spectra are fitted using nonlinear optimization techniques such as the **Levenberg–Marquardt algorithm**.

The fitting process extracts several physically meaningful parameters.

#### Stokes (I)

The intensity profile is typically modeled using Gaussian or Voigt functions to determine:

* Peak intensity ((I_0))
* Doppler width ((\Delta\lambda_D))
* Central wavelength ((\lambda_0))

#### Stokes (Q) and (U)

The linear polarization components are fitted simultaneously to derive the magnetic field azimuth:

$$
\chi = \frac{1}{2}
\tan^{-1}
\left(
\frac{U}{Q}
\right).
$$

#### Stokes (V)

The circular polarization profile is fitted using derivative-based models characteristic of weak Zeeman splitting.

The resulting amplitude provides the key input for magnetic field inversion.

---

## The Weak Field Approximation

Coronal magnetic field measurements frequently rely on the **Weak Field Approximation (WFA)**.

The approximation is valid when magnetic splitting is much smaller than the thermal Doppler width of the spectral line.

For the Fe XIII 1074.7 nm transition:

$$
\Delta\lambda_Z \ll \Delta\lambda_D.
$$

Under these conditions, the Stokes (V) profile becomes proportional to the wavelength derivative of the intensity profile:

$$
V(\lambda)
==========

*

g_{\rm eff}
\Delta\lambda_H
B_\parallel
\frac{dI(\lambda)}{d\lambda}.
$$

Here,

$$
\Delta\lambda_H
===============

\frac{
e\lambda_0^2
}{
4\pi m_e c^2
},
$$

where (e) is the electron charge, (m_e) the electron mass, and (c) the speed of light.

For the Fe XIII 1074.7 nm line,

$$
g_{\rm eff} = 1.5.
$$

---

## Constructing a Coronal Magnetic Field Map

The inversion process is conceptually straightforward.

First, the fitted Stokes (I) profile is differentiated numerically to obtain

$$
\frac{dI}{d\lambda}.
$$

A linear regression then determines the scaling factor required to match the observed Stokes (V) profile.

The resulting coefficient directly yields the longitudinal magnetic field strength,

$$
B_\parallel.
$$

Repeating this procedure at every spatial pixel generates a two-dimensional map of coronal magnetic field strength.

These maps provide one of the few direct observational constraints on coronal magnetic topology.

---

## Why DKIST and CryoNIRSP Matter

Measuring coronal magnetic fields requires extraordinary sensitivity.

The combination of the **Daniel K. Inouye Solar Telescope (DKIST)** and the **Cryogenic Near-Infrared Spectropolarimeter (CryoNIRSP)** represents a major leap forward in observational capability.

### Large Aperture Advantage

DKIST's 4-meter primary mirror gathers an unprecedented number of photons, enabling extremely high signal-to-noise observations of faint coronal structures.

This sensitivity is essential for detecting the weak Stokes (V) signatures produced by coronal magnetic fields.

### Cryogenic Instrumentation

CryoNIRSP operates using cryogenically cooled optics that dramatically reduce thermal infrared background contamination.

This is particularly important for observations between

$$
1\ \mu{\rm m}
\quad \text{and} \quad
5\ \mu{\rm m}.
$$

### High Spatial Resolution

Sub-arcsecond resolution allows researchers to isolate individual magnetic structures, including coronal loops and current sheets.

This minimizes line-of-sight averaging effects that can otherwise obscure magnetic signatures.

---

## Further Reading

For readers interested in the theoretical and observational foundations of coronal spectropolarimetry:

### Foundational Coronal Polarimetry

* Judge, P. G. (1998), *Spectral Lines for Polarization Measurements of the Coronal Magnetic Field*.
  https://iopscience.iop.org/article/10.1086/309039

### Coronal Magnetic Field Inversions During Solar Eclipses

* Dima, G. I., et al. (2020), *Forward Modeling and Inversion of Coronal Polarization Measurements*.
  https://iopscience.iop.org/article/10.3847/1538-4357/ab6a91

### Interactive CryoNIRSP Data Exploration

* CryoNIRSP Viewer
  https://sr-dash.github.io/cryonirsp-viewer/

---

## Looking Ahead

Direct measurements of coronal magnetic fields remain among the most difficult observations in solar physics. Yet they are also among the most valuable.

By combining advanced spectropolarimetric diagnostics, sophisticated inversion techniques, and next-generation facilities such as DKIST, researchers are beginning to probe the magnetic architecture of the corona with unprecedented detail.

As these measurements improve, they will provide critical insights into coronal heating, solar eruptions, and the magnetic processes that govern space weather throughout the Solar System.
