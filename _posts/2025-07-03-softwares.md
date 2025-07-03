---
layout: post
title: How to configure a new system with supporting libraries for compiling MHD models?
date: 2025-07-03 15:09:00
description: instructions for setting up software packages and configuring systems for global simulations 
tags: configuration newsystem code
categories: research
featured: false
---

Often when migrating to new systems, it can get difficult to setup all the necessary libraries and packages in the target system for 
continuing working on the mddelling. In this post I will try to summarize the libraries required for setting up some of the simulations codes e.g., 
SWMF, MPI-AMRVAC, SFT-1D. Some of these codes require `hdf5`, `netcdf-c/fortran`, `zlib`, `curl`, `OPENMPI` and `GCC`. 

**GCC**
It is quite simple to build up on the existing system libraries (on Linux/Mac systems). The bash script file [`build_gcc_13.2.0.sh`](https://github.com/darrenjs/howto/blob/master/build_scripts/build_gcc_13.2.0.sh) is the best resource for this. 
Download the file and run it in a `bash` shell. **Add `fortran` language to the list of langiages inside the shell script.** At the end of the building, it will show the instructions to append the installed libraries to the system `$PATH`. The script downloads and installs the libraries on the system. A note of caution, the whole process may take about ~3 hrs., so be patient.

After this, you can build the `OPENMPI` libraries. The installation version `openmpi-4.1.5` seem to work for me with the `GCC` installation versions. I prefer building the libraries with a local prefix.

Inside the openmpi-4.1.5 directory run the following,

```
./configure --prefix=~/opt/openmpi-4.1.5
make -j 4
make install
```

Here are a few lines that you can add to the `~/.bashrc` or `~/.zshrc` file after the `OPENMPI` installation.

```
export PATH=~/openmpi-4.1.5/bin:~/opt/gcc-13.2.0/bin:$PATH
export LD_LIBRARY_PATH=~/openmpi-4.1.5/lib:~/opt/gcc-13.2.0/lib:~/opt/gcc-13.2.0/lib64:$LD_LIBRARY_PATH
export MANPATH=~/opt/gcc-13.2.0/share/man:$MANPATH
export INFOPATH=~/opt/gcc-13.2.0/share/info:$INFOPATH
```

After the installation you can check the version of the `gcc` by typing `gcc -v`. Similarly for `fortran` as well. At the end of this the system should have all the `mpicc, mpif90, gcc, gfortran` executables in the default `$PATH` variable.

**netCDF**
Installation of netcdf libraries is dependent on multiple other libraries e.g., `curl`, `zlib`, `hdf5`, `netcdf-c` and `netcdf-fortran`. Here is a shell script [install_netcdf.sh](https://github.com/sr-dash/SFT-1D/blob/main/install_netcdf.sh) for this. A few extra install flags and versions are suggested for a system-wide installation.

Suggested versions 
* `hdf5-1.14.6`, build with `--enable-fortran`, `--enable-cxx`/`--enable-parallel`.
* `netcdf-c-4.9.3`
* `netcdf-fortran-4.6.1`
* `zlib-1.3.1`
* `curl-8.14.1`

Again the shell script downloads the required files and builds the libraries at a user location.


**None of the scripts require admin privileges, so building these libraries should be self-sufficient.** 

After building these libraries, you must update the system `$PATH$` variable for future use. Individual simulation codes require independent path to the libraries.

Hope this helps!
