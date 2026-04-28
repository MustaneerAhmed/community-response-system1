# ReliefSync – Community Response System

## 🚀 Overview
ReliefSync is a smart community response system designed to help NGOs and social organizations efficiently manage and allocate volunteers based on real-time community needs.

The system collects issue data, analyzes urgency using a scoring mechanism, and assigns the most suitable volunteer using rule-based matching.

---

## ❗ Problem Statement
Local NGOs collect valuable data about community needs through surveys and reports. However, this data is often scattered and unstructured, making it difficult to identify urgent problems and allocate volunteers effectively.

---

## 💡 Solution
ReliefSync transforms raw community data into actionable insights by:
- Structuring issue data through a simple input system
- Calculating a priority score based on urgency and impact
- Assigning volunteers based on skill, location, and availability

---

## ⚙️ Features

### 🟢 Issue Analysis
- Input community needs (type, urgency, people affected, location)
- Score-based priority system (High / Medium / Low)

### 🟢 Smart Volunteer Assignment
- 3-tier matching system:
  - Tier 1: Skill + Location match
  - Tier 2: Skill match
  - Tier 3: Fallback assignment
- Filters unavailable volunteers
- Supports multiple skills:
  - Medical
  - Food
  - Rescue
  - Logistics
  - General

### 🟢 Volunteer Management
- Predefined dataset of volunteers
- Availability tracking
- Visual indicators (available/unavailable)

### 🟢 Clean UI
- Step-based workflow
- Assignment cards with clear output
- Responsive design

---

## 🧠 Methodology

1. **Data Collection**
   - User inputs community issues through a form

2. **Data Processing**
   - JavaScript processes inputs and calculates a score

3. **Priority Determination**
   - Score is mapped to priority levels

4. **Volunteer Matching**
   - Filters available volunteers
   - Matches based on skill and location using a 3-tier logic

5. **Result Display**
   - Displays priority and assigned volunteer

---

## 🛠️ Tech Stack

- HTML
- CSS
- JavaScript
- Vercel (Deployment)
- GitHub (Version Control)

---

## 🌐 Live Demo
https://reliefsyncc.vercel.app

---

## 📦 Installation (Local Setup)

```bash
git clone https://github.com/your-username/community-response-system.git
cd community-response-system