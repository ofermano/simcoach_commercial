# FLOW Simulator Coach Mock – Developer Setup Guide

This guide explains how to run the FLOW Simulator Coach Mock together with Assetto Corsa for development purposes.


# Requirements

## Assetto Corsa (Steam)

Install via Steam.

## Python 3.3 (Required for AC Plugin)

Assetto Corsa uses embedded Python 3.3.

Download:
https://www.python.org/downloads/release/python-330/

## Python 3.12 (For Simulator Coach Mock)

Download:
https://www.python.org/downloads/release/python-3124/

Used only to run the Simulator Coach Mock.

# Installing the AC Plugin

## Copy the plugin

Copy all the files in:

./core_application/edge_injection/

Into:

C:\Program Files (x86)\Steam\steamapps\common\assettocorsa\apps\python


After copying, the folder structure should be:

assettocorsa/
└── apps/
    └── python/
        └── Flow/
            ├── Flow.py
            ├── third_party/
            └── ...

## Enable the Plugin

Open Content Manager

Go to Settings → Assetto Corsa → Python Apps

Ensure:

“Enable Python Apps” is checked

“Flow” is enabled

# Running 

## Running the Simulator Coach Mock

From project root:

cd core_application
python main.py

Expected output:

Server listening on 127.0.0.1:65432

## Running Assetto Corsa

Start the Simulator Coach Mock.

Launch Assetto Corsa session via Content Manager.

Practice mode recommended.

Start from the starting line.

If functioning correctly:

The service console will show a connection message and will print the speed you were driving.
