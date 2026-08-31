# 🌞 Soumyaranjan Dash — Solar Physics Research Portfolio

<div align="center">

[![Website](https://img.shields.io/badge/Website-Live-success?style=for-the-badge)](https://sr-dash.github.io/)
![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue?style=for-the-badge\&logo=github)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge\&logo=css3\&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)

![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=sr-dash.sr-dash.github.io)

**Solar Physicist • Scientific Programmer • Numerical Modeler • Educator**

🌐 **Live Website:** https://sr-dash.github.io/

</div>

---

## About

This repository hosts my personal academic website, developed to showcase research, publications, scientific software, teaching activities, and educational resources in solar physics and heliophysics.

The site serves as a central hub for my work involving solar observations, spectropolarimetry, coronal magnetic field diagnostics, numerical simulations, data analysis pipelines, and scientific visualization.

---

## Research Interests

* Solar Physics
* Heliophysics
* Coronal Magnetism
* Spectropolarimetry
* DKIST & Cryo-NIRSP Observations
* Solar Eclipse Science
* Magnetohydrodynamic (MHD) Simulations
* Forward Modeling
* Inverse Problems
* Scientific Computing
* Data Visualization
* Space Weather

---

## Website Highlights

### 📚 Publications

Peer-reviewed journal articles, conference proceedings, citation information, and links to published research.

### 🔭 Research

Research projects spanning:

* Coronal magnetic field measurements
* Infrared spectropolarimetry
* Solar eclipse prediction studies
* Polarization synthesis
* Solar cycle investigations
* Numerical modeling of solar plasmas

### 🛠 Scientific Software

Interactive tools and utilities developed for:

* Solar data analysis
* Visualization
* Spectral diagnostics
* Research workflows
* Scientific communication

### 📝 Blog

Technical and educational articles covering:

* Solar physics concepts
* Scientific programming
* Numerical methods
* Data analysis techniques
* Research insights

### 🎓 Teaching

Course material, lecture notes, tutorials, and educational resources related to astronomy, astrophysics, and computational science.

---

## Featured Topics

| Area                 | Description                                        |
| -------------------- | -------------------------------------------------- |
| Solar Corona         | Structure, dynamics, and magnetic fields           |
| Spectropolarimetry   | Magnetic field diagnostics using polarized light   |
| Cryo-NIRSP           | Infrared coronal observations and analysis         |
| Numerical Modeling   | MHD simulations and forward modeling               |
| Scientific Computing | High-performance scientific workflows              |
| Data Visualization   | Interactive and publication-quality visualizations |
| Solar Eclipses       | Prediction, analysis, and educational resources    |

---

## How the site is built

Jekyll on GitHub Pages. Every page shares one layout, so the navigation,
sidebar, footer, analytics snippet, and structured data live in a single place
each rather than being copied into every file.

```text
_config.yml            site settings and plugins
_data/                 content as data — publications, projects, courses,
                       resource catalogues, navigation, social links
_includes/             head, sidebar, footer, and the renderers that turn
                       _data into markup at build time
_layouts/              default.html (all pages) and post.html (articles)
_posts/                articles, in Markdown with YAML front matter
assets/css/            style.css, icons.css, plus per-section stylesheets
assets/js/             view controllers — no page fetches its own content
assets/vendor/         self-hosted MathJax, Prism and marked
scripts/               bib_to_data.py, which regenerates the publication data
```

Everything a visitor reads is in the HTML when the page arrives. No list on
this site is assembled in the browser, so it all works without JavaScript and
is visible to crawlers.

### Working on it locally

```bash
bundle install
bundle exec jekyll serve
```

### Updating publications

The BibTeX export from ADS stays the source of truth:

```bash
# 1. export from ADS over assets/data/soumya_publications.bib
# 2. update the "% citations_updated:" date at the top of that file
python3 scripts/bib_to_data.py
```

That regenerates `_data/publications.yml`. CI runs the same script with
`--check` and fails if the two have drifted apart.

### Adding an article

Drop a Markdown file in `_posts/` named `YYYY-MM-DD-slug.md`:

```yaml
---
layout: post
title: "..."
date: 2026-01-15
category: concepts     # concepts | methods | research
tags: [Solar Physics, MHD]
excerpt: "One or two sentences; used on the hub, in the feed, and as the meta description."
---
```

The articles hub, the category filters, the RSS feed and the sitemap all pick
it up automatically.

---

## Live Website

Visit the website:

👉 https://sr-dash.github.io/

The website is automatically deployed through GitHub Pages.

---

## Research Profiles

* Google Scholar
* ORCID
* NASA ADS
* GitHub
* LinkedIn

(Links available on the website.)

---

## SEO Keywords

solar physics, heliophysics, solar corona, coronal magnetism, spectropolarimetry, Cryo-NIRSP, DKIST, solar eclipse, MHD simulations, scientific computing, astrophysics, space weather, solar observations, data visualization, numerical modeling, astronomy education, scientific software

---

## Citation

If you find any of the scientific resources, educational content, software, or visualizations useful in your research or teaching, please cite the associated publication whenever appropriate.

---

## Contact

**Soumyaranjan Dash**

Solar Physicist | Researcher | Scientific Software Developer

🌐 Website: https://sr-dash.github.io/

📧 Contact information available through the website.

---

## License

Content is CC BY 4.0, site code is MIT. See [LICENSE](LICENSE) for the split and
[NOTICE](NOTICE) for bundled third-party components.

Figures reproduced from published papers remain subject to their publishers'
terms; check the relevant publication before reuse.

---

<div align="center">

### ☀️ Exploring the Sun through observations, simulations, and scientific computing

</div>

