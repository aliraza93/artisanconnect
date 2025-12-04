# ArtisanConnect SA - User & Admin Manual

**Version:** 1.0  
**Last Updated:** December 4, 2025

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Client (Homeowner) Guide](#3-client-homeowner-guide)
4. [Artisan Guide](#4-artisan-guide)
5. [Administrator Guide](#5-administrator-guide)
6. [Common Features](#6-common-features)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Introduction

### About ArtisanConnect SA

ArtisanConnect SA is a marketplace platform that connects South African homeowners with vetted artisans (plumbers, electricians, builders, etc.) and logistics providers. The platform ensures trust and quality through:

- **Verified Artisans:** All service providers are vetted before joining
- **Escrow Payments:** Funds are held securely until work is completed
- **20% Commission Model:** Platform fee ensures quality support and dispute resolution
- **Review System:** Transparent ratings help homeowners make informed decisions

### Platform Access

The platform is accessible via any modern web browser at your deployed URL. As a Progressive Web App (PWA), it can also be installed on mobile devices for app-like experience.

---

## 2. Getting Started

### Creating an Account

1. Navigate to the homepage
2. Click **"Sign Up"** or **"Get Started"** button
3. Choose your account type:
   - **Client (Homeowner):** Looking to hire artisans
   - **Artisan:** Offering services
4. Fill in required information:
   - Full Name
   - Email Address
   - Phone Number
   - Password (minimum 8 characters)
5. For Artisan accounts, additional profile information is required:
   - Service Category (e.g., Plumbing, Electrical)
   - Years of Experience
   - Location/Service Area
   - Skills and Certifications
6. Click **"Create Account"**

### Logging In

1. Click **"Login"** in the navigation bar
2. Enter your registered email and password
3. Click **"Sign In"**
4. You'll be redirected to your dashboard

### Password Recovery

*Note: Password recovery feature implementation pending. Contact admin for password resets.*

---

## 3. Client (Homeowner) Guide

### Dashboard Overview

After logging in, clients see their personalized dashboard with:
- **Active Jobs:** Current projects in progress
- **Open Jobs:** Jobs awaiting quotes
- **Completed Jobs:** Finished projects
- **Messages:** Communication with artisans

### Posting a Job

1. Click **"Post a Job"** from the dashboard or navigation
2. Fill in job details:
   - **Job Title:** Brief description (e.g., "Fix leaking bathroom tap")
   - **Category:** Select service type (Plumbing, Electrical, etc.)
   - **Description:** Detailed explanation of work needed
   - **Location:** Your address or area
   - **Budget:** Optional estimated budget
   - **Logistics Needed:** Check if you need materials delivered
3. Click **"Submit Job"**
4. Your job is now visible to qualified artisans

### Reviewing Quotes

1. When artisans submit quotes, you'll see them in your dashboard
2. Click on a job to view all received quotes
3. Each quote shows:
   - Artisan name and rating
   - Quoted price
   - Message/notes from artisan
   - Artisan's profile (experience, reviews)
4. Compare quotes before making a decision

### Accepting a Quote

1. Review the quote carefully
2. Check the artisan's profile and reviews
3. Click **"Accept Quote"**
4. Payment will be held in escrow automatically
5. The artisan will be notified to begin work

### Payment Process

1. **Escrow:** When you accept a quote, the full amount is held securely
2. **Work Completion:** Artisan completes the work
3. **Release Payment:** After satisfactory completion, release the payment
4. **Commission:** 20% goes to the platform, 80% to the artisan

### Releasing Payment

1. Confirm the work is completed to your satisfaction
2. Go to the job in your dashboard
3. Click **"Release Payment"**
4. Funds are transferred to the artisan

### Rating & Reviews

1. After a job is completed, you can leave a review
2. Rate the artisan (1-5 stars)
3. Write a comment about your experience
4. Reviews help other homeowners make decisions

### Opening a Dispute

If you're unsatisfied with the work:
1. Navigate to the job
2. Click **"Open Dispute"**
3. Select the issue type
4. Provide detailed description
5. Admin will investigate and mediate

---

## 4. Artisan Guide

### Profile Setup

Complete your profile to attract clients:
1. Go to your profile settings
2. Add/update:
   - Professional bio
   - Skills and expertise
   - Certifications
   - Years of experience
   - Service areas
   - Profile photo

### Finding Jobs

1. Browse open jobs in your dashboard
2. Filter by:
   - Category (your specialty)
   - Location
   - Budget range
3. Click on a job to view full details

### Submitting Quotes

1. Select a job you want to bid on
2. Click **"Submit Quote"**
3. Enter your quote details:
   - **Price:** Your total cost for the job
   - **Message:** Explain your approach, timeline, etc.
4. Click **"Submit"**
5. Wait for client's response

### Quote Best Practices

- Be competitive but fair with pricing
- Explain what's included in your quote
- Highlight relevant experience
- Respond quickly to increase chances
- Be clear about timeline

### Managing Active Jobs

1. View all your active jobs in the dashboard
2. Communicate with clients through messaging
3. Update clients on progress
4. Notify when work is complete

### Receiving Payments

1. Complete the work as agreed
2. Client releases payment from escrow
3. You receive 80% of the quoted amount
4. 20% is retained as platform commission
5. Funds reflect in your account

### Building Your Reputation

- Deliver quality work consistently
- Communicate proactively with clients
- Complete jobs on time
- Encourage satisfied clients to leave reviews
- Maintain high ratings (4+ stars)

---

## 5. Administrator Guide

### Accessing Admin Dashboard

1. Log in with admin credentials
2. Navigate to `/admin/dashboard` or click "Admin" in navigation
3. Dashboard shows platform overview

### Dashboard Metrics

The admin dashboard displays:
- **Total Platform Revenue:** Commission earned from all transactions
- **Active Jobs:** Current jobs on the platform
- **Registered Users:** Total client and artisan accounts
- **Open Disputes:** Cases requiring attention

### User Management

*Note: Full user management features pending implementation*

Current capabilities:
- View registered users
- Monitor user activity
- Handle dispute resolutions

### Dispute Resolution

1. View all disputes in the "Disputes" tab
2. Each dispute shows:
   - Client and artisan involved
   - Job details
   - Issue description
   - Current status
3. To resolve a dispute:
   - Review all information
   - Contact parties if needed
   - Make a decision
   - Click **"Resolve Dispute"**
   - Add resolution notes
   - Payment can be released to artisan or refunded to client

### Revenue Management

1. View total platform revenue from 20% commission
2. Track revenue trends
3. Withdrawal process:
   - Enter withdrawal amount
   - Click **"Initiate Withdrawal"**
   - Funds process in 1-3 business days

### Artisan Verification

*Note: Manual verification process*

1. Review artisan applications
2. Verify credentials and certifications
3. Mark artisan as verified/unverified
4. Verified artisans display a verification badge

---

## 6. Common Features

### Messaging System

1. Access messages from your dashboard
2. Select a conversation
3. Type your message
4. Click send
5. Messages are associated with specific jobs

### Notifications

Users receive notifications for:
- New quotes on their jobs (Clients)
- New job opportunities (Artisans)
- Quote acceptance/rejection
- Messages
- Payment updates
- Dispute updates

### Profile Management

1. Click on your profile icon
2. Select "Settings" or "Profile"
3. Update your information
4. Save changes

### Mobile Access (PWA)

To install on mobile:
1. Visit the website in your mobile browser
2. Chrome: Tap menu → "Add to Home Screen"
3. Safari: Tap share → "Add to Home Screen"
4. The app icon will appear on your device

---

## 7. Troubleshooting

### Login Issues

**Problem:** Can't log in  
**Solutions:**
- Verify email address is correct
- Check password (case-sensitive)
- Clear browser cache
- Try a different browser
- Contact admin for password reset

### Job Not Visible

**Problem:** Posted job not appearing  
**Solutions:**
- Check job status in dashboard
- Ensure job was submitted successfully
- Refresh the page
- Check filters aren't hiding it

### Payment Issues

**Problem:** Payment not processing  
**Solutions:**
- Check internet connection
- Verify payment details
- Contact admin for assistance
- Wait and retry

### Quote Not Submitting

**Problem:** Unable to submit quote  
**Solutions:**
- Ensure all required fields are filled
- Check you have an artisan account
- Verify your profile is complete
- Refresh and try again

### Contact Support

For unresolved issues, contact:
- **Email:** admin@artisanconnect.co.za
- **Platform:** Use the messaging feature to contact admin

---

## Appendix: Service Categories

Currently supported categories:
- Plumbing
- Electrical
- Building & Construction
- Painting
- Carpentry
- Roofing
- HVAC (Heating/Cooling)
- Landscaping
- General Handyman
- Cleaning Services

---

*Document End*
