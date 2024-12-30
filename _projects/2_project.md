---
layout: page
title: Magnetic null-points
description: Magnetic null point calculation on three dimensional vector coronal magnetic field datacube
img: assets/img/project2/null_hmi_nov2014.png
importance: 1
category: work
related_publications: false
---

Understanding the large-scale distribution of the solar coronal field requires data-driven numerical modeling. In this context, Potential Field Source Surface (PFSS) extrapolation technique is commonly used to compute the global solar coronal magnetic fields using photospheric magnetic field distribution as boundary conditions. While the assumption of current-free corona in PFSS is restrictive in exploring the non-potentiality of the coronal magnetic fields, we can study the location of three-dimensional coronal null points that indicate potential locations of reconnection with such a simplified extrapolation method. Additionally we can also compute the squashing-factor which is indicative of current-sheets. We develop a python-based subroutine to calculate the null-point locations in a spherical coordinate system following the IDL module publically distributed with SSWIDL (originally written by Dr. Marc L. DeRosa). In order to calculate the squashing-factor we utilize k-QSL, an open source code suite developed by Dr. Kai Yang. As we progress through a phase of the solar cycle where the magnetic activity is approaching towards solar-cycle-maximum with reversal of the polar magnetic field polarity, we focus on such epochs of the solar cycle to understand the life-time of the coronal null-points. Here is a description of our ongoing research.


<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/project2/pfss_layers_nov10.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 1. Potential field extrapolation for 2014-11-10T00:04:00. Different layers show the radial  magnetic field at various heights, where the source surface is at 2.5 Rsun with black/white indicating negative/positive polarity.
</div>


<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/project2/null_all_v1.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 2. Distribution of three-dimensional null points for 2014-11-10T00:04:00. Size of the markers indicate different heights.
</div>

<div class="row justify-content-sm-center">
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/project2/null_highest_fl_v1.png" title="example image" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-8 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/project2/nullpoint_Q_nov2014.png" title="example image" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Figure 3. Location of a three-dimensional null point for 2014-11-10T00:04:00 with magnetic field lines overplotted on the photospheric boundary condition on the left panel where golden lines show closed magnetic field lines and blue indicate field lines starting from negative polarity foot points. On the right panel, we plot the distribution of the squashing factor at different planes corresponding to respective null point locations where different colors indicate the sign of the spatial distribution of the polarity of the magnetic field. The dashed lines on the right panel indicate the corresponding location of the indicative null point. A change in sign indicated by the color of squashing factor shows the location of the null point in the volume.
</div>

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/project2/Q_layers_nov10.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 4. Squashing factor distribution computed using PFSS extrapolated magnetic fields for 2014-11-10T00:04:00. Different layers show the squashing factor at various heights, where red/blue indicates negative/positive polarity of the magnetic field at respective locations.
</div>

Such an analysis shows the distribution of the coronal magnetic fields and spatial distribution of three dimensional null points for a given photospheric boundary condition. This is an ongoing work to explore the location of null points in space and understand the potential location of long-lived reconnection sites over multiple solar rotations.

