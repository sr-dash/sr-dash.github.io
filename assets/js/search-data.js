// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "About",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blogs",
          title: "Blogs",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-publications",
          title: "Publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "A short description of research projects.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-repositories",
          title: "Repositories",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "The pdf file is a summary of the resume.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-",
          title: "",
          description: "Materials for courses you taught. Replace this text with your description.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/teaching/";
          },
        },{id: "nav-",
          title: "",
          description: "members of the lab or group",
          section: "Navigation",
          handler: () => {
            window.location.href = "/people/";
          },
        },{id: "dropdown-publications",
              title: "publications",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "";
              },
            },{id: "dropdown-projects",
              title: "projects",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "";
              },
            },{id: "dropdown-blog",
              title: "blog",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/blog/";
              },
            },{id: "post-ensemble-kalman-filter-implementation-with-sft-model-to-solar-surface-infer-flow-properties",
      
        title: "Ensemble Kalman-Filter implementation with SFT model to solar surface infer flow properties",
      
      description: "Advancing Solar Magnetic Field Forecasting with Ensemble Kalman Filter and Surface Flux Transport Models",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/blog/2024/enkf/";
        
      },
    },{id: "post-long-term-modulation-of-heliosphere",
      
        title: "Long-term modulation of heliosphere",
      
      description: "Unveiling the Sun&#39;s Magnetic Mysteries -- Insights into Coronal Fields, Open Flux, and Cosmic Ray Modulation",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/blog/2024/longterm/";
        
      },
    },{id: "post-magnetic-field-configuration-prediction-for-total-solar-eclipse-of-2019",
      
        title: "Magnetic field configuration prediction for total solar eclipse of 2019",
      
      description: "Predicting the Sun&#39;s Coronal Magnetic Field -- Insights from the 2019 Total Solar Eclipse",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/blog/2020/eclipse2019/";
        
      },
    },{id: "news-article-published-online-in-the-astrophysical-journal-doi-10-3847-1538-4357-ad7eac",
          title: 'Article published online in The Astrophysical Journal (DOI: 10.3847/1538-4357/ad7eac).',
          description: "",
          section: "News",},{id: "projects-synthetic-corona",
          title: 'Synthetic Corona',
          description: "Synthesized coronal emission line analysis with Global MHD model",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-magnetic-null-points",
          title: 'Magnetic null-points',
          description: "Magnetic null point calculation on three dimensional vector coronal magnetic field datacube",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-far-side-data-assimilation-into-sft-model",
          title: 'Far-side data assimilation into SFT model',
          description: "Inferred active region properties retrived from Time-Distance Helioseismology method will be added into SFT evolution.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{id: "projects-dkist-data-analysis",
          title: 'DKIST Data analysis',
          description: "Working with Cryo-NIRSP data",
          section: "Projects",handler: () => {
              window.location.href = "/projects/4_project/";
            },},{id: "projects-project-5",
          title: 'project 5',
          description: "a project with a background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/5_project/";
            },},{id: "projects-project-6",
          title: 'project 6',
          description: "a project with no image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/6_project/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%64%61%73%68%73@%68%61%77%61%69%69.%65%64%75", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/sr-dash", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/soumya-theory", "_blank");
        },
      },{
        id: 'social-orcid',
        title: 'ORCID',
        section: 'Socials',
        handler: () => {
          window.open("https://orcid.org/0000-0003-0103-6569", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=_agi4pMAAAAJ", "_blank");
        },
      },{
        id: 'social-x',
        title: 'X',
        section: 'Socials',
        handler: () => {
          window.open("https://twitter.com/soumyatheory", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
