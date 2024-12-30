---
layout: page
title: Synthetic Corona
description: Synthesized coronal emission line analysis with Global MHD model
img: assets/img/project1/wfa2276.png
importance: 1
category: work
related_publications: true
---

Solar atmospheric dynamics primarily creates and modulates our space environment. Solar atmosphere, also known as solar corona, extends out into the heliosphere beyond the surface and consists of a million-degree hot, in-homogeneous, almost completely ionized, magnetized plasma material. However, the coronal plasma density is relatively low as compared to the solar photosphere. We have been developing resources to precisely observe the coronal magnetic fields routinely which still remains challenging due to low coronal density and high-temperature induced line-broadening.

In this context, Daniel K Inouye Solar Telescope (DKIST) is uniquely capable of obtaining measurements to perform vector magnetometry of the off-limb solar corona. The spectral signals from Cryogenic Near-Infrared Spectropolarimeter (Cryo-NIRSP) in DKIST is suitable for routine coronal magnetometry in Fe XIII line pair. We can forward synthesize the polarization vectors using three dimensional global full-magnetohydrodynamic simulation outputs. For our experiment, we obtain outputs of Magnetohydrodynamic Algorithm outside a Sphere (MAS) code distributed by Predictive Sciences group for the carrington rotation 2276. Figure 1 shows the distribution of vector magnetic field components in the plane of sky in the reference frame of DKIST observations in the PSI model frame.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/project1/Bfield_los.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 1. DIstribution of magnetic field in the plane of sky from the DKIST reference frame in the PSI model coordinates. The domain extends till 3 solar radius in X and Y directions.
</div>

If we only consider the Thomson scattering in the solar corona where coronal electromagnetic radiation is scattered by free charged particles, we can model the weighted density and temperature distribution. The modeled radiation from the corona in 10747 nm which is one of the observable coronal lines in Cryo-NIRSP is shown in Figure 2.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/project1/thomson_forward.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 2. Forward synthesized polarized brightness distribution due to Thomson scattering.
</div>

Utilizing the scattering signals, we can also compute the weighted density and temperature distribution which is shown in Figure 3. These computations show the million degree solar corona near the limb which indicates the plasma frozen into coronal magnetic loops above the active regions.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/project1/scattering_weighted.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 3. Density and temperature distribution in the POS weighted by Thomson scattering.
</div>

However, radiation from the solar corona is polarized due to the presence of magnetic fields. We also compute the polarization vectors for this case which are shown in Figure 4.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/project1/emission_1074.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 4. Forward modeled polarization signals in the POS for 2023-10-11 in the DKIST observer reference frame. The cyan-lines indicate the targeted DKIST pointing.
</div>

Cryo-NIRSP in DKIST is set to measure the polarization signals in the solar corona in Infra-red lines. Therefore it is essential to perform such experiments with coronal simulation datacubes to understand the expected qualities of the observations assuming the model is capable of reproducing most of the physical processes associated with coronal radiation. As the measurements will likely include the background scattered light from the photosphere, one has to be careful in pre-processing the signals to remove the scattering for the targeted coronal emission line. Figure 5 shows the Stokes spectra for the dataset at 1074.6 nm.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/project1/stokes_spectra.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 5. Forward synthesized polarization signal for Fe XIII emission line.
</div>

This exercise to compute the synthetic polarization signal from the MHD dataset provides us insights to the magnetic field distribution in the POS. Such computations are key to provide guidance to data preprocessing and later observations will provide more constraints on the simulation parameters to better understand the physical processes associated with the solar coronal dynamics. We plan to analyze the Cryo-NIRSP observations of solar corona and perform inversion analysis to compute the magnetic field when the data is available. 