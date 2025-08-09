# ![Simple Rentals Logo](frontend/public/static/images/transp_full_icon.png)

[![Cypress E2E Tests](https://github.com/armaksymov/rent/actions/workflows/cypress.yml/badge.svg?branch=main)](https://github.com/armaksymov/rent/actions/workflows/cypress.yml) [![Django CI](https://github.com/armaksymov/rent/actions/workflows/django.yml/badge.svg?branch=main)](https://github.com/armaksymov/rent/actions/workflows/django.yml) [![Vitest CI](https://github.com/armaksymov/rent/actions/workflows/vitest.yml/badge.svg?branch=main)](https://github.com/armaksymov/rent/actions/workflows/vitest.yml)

A full-stack rental and roommate-finding platform

---

## 🚀 Live Demo

Try Simple Rentals here! <br> <br> [![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-blue)](https://transcendent-concha-495d54.netlify.app/) 

---

## 📌 Overview

Simple Rentals is a web application designed to simplify the process of finding rentals, roommates, and group housing. Users can:

- 🎯 **Post rentals**, adding all the information you want to make your listing stand out!
- 🔍 **Search and Filter listings** by items such as location, property type, price, etc. Helping you find your perfect fit!
- 🔝 **Create a roommate profile** so that others also looking for a roommate can connect with you!
- 🧑‍🤝‍🧑 **Search for your ideal roommate** using advanced search & filtering.
- 💬 **Chat and connect!** Contact owners or form groups to rent together.
- ✍ **Voice your opinion!** Leave reviews about your experiences with other users.
- 🤖 **Get personalized recommendations** based on your activity on the platform! Our ML model (built with ```sklearn```) looks at your interactions and maps what listings might be of the most interest to you.

Built with a Django + PostgreSQL backend and a Vite + React + Bootstrap frontend, the platform is fully containerized, tested, and deployed with continuous integration and delivery.

---

## 🛠 Tech Stack

Our full-stack app uses multiple technologies that all work together to give our idea form.

### Frontend
- React
- Bootstrap
- Cypress (E2E testing)
- Vitest (unit testing)

### Backend
- Django Rest Framework (DRF)
- PostgreSQL
- DRF API tests (```APITestCase```)

### Infrastructure
- Docker (containerized development)
- GitHub Actions (CI/CD pipelines for testing & deployment)
- Railway (backend & database hosting)
- Netlify (frontend hosting)

---

## ✨ Features

- **Listings & Search** – Post, edit, and filter rental listings.
- **Listing Recommendation** - Get personalized recommendations based on your activity.
- **Save Listings** - Mark your favourite listings so they are saved in your account.
- **Reviews** – Write and view property reviews.
- **Groups & Chat** – Create groups, invite members, and coordinate via chat.
- **Applications** – Apply to listings as a group.
- **Google Maps Integration** – Register and display precise rental locations.
- **Authentication** – Secure user accounts with JWT-based authentication.

---

## 🧪 Testing

- **Backend** – Unit tested using Django REST Framework’s APITestCase.
- **Frontend** – End-to-end tested with Cypress and unit tested with Vitest.
- All tests run automatically through GitHub Actions on every push and pull request.


