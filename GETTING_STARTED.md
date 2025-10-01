# Getting Started with HTML Prototype Builder

Welcome! This guide will walk you through setting up and using the HTML Prototype Builder to create your first interactive prototype.

## What You'll Build

By the end of this guide, you'll have:
- A running local instance of the HTML Prototype Builder
- Your first AI-generated prototype
- Understanding of how to refine and export prototypes

## Step 1: Installation (5 minutes)

### Prerequisites Check
```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version (should be 9+)
npm --version
```

### Install the Application
```bash
# Clone or navigate to the project directory
cd jp

# Install all dependencies
npm install
```

This will install dependencies for:
- Frontend (React + Vite)
- Backend (Node.js + Express)
- Shared types package

## Step 2: Get an LLM API Key (5 minutes)

You need an API key from one of these providers:

### Option 1: DeepSeek (Recommended for cost)
1. Visit https://platform.deepseek.com/
2. Sign up for an account
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-`)

### Option 2: OpenAI
1. Visit https://platform.openai.com/
2. Sign up and add credits
3. Go to API Keys section
4. Create new secret key
5. Copy the key

### Option 3: Anthropic (Claude)
1. Visit https://console.anthropic.com/
2. Sign up for an account
3. Navigate to API Keys
4. Create a new key
5. Copy the key

### Option 4: Ollama (Free, Local)
1. Install Ollama from https://ollama.ai/
2. Run: `ollama pull llama2`
3. No API key needed!

## Step 3: Configure the Backend (2 minutes)

```bash
# Navigate to backend
cd backend

# Copy the example environment file
cp .env.example .env

# Edit the .env file
# On Windows: notepad .env
# On Mac/Linux: nano .env
```

**For DeepSeek**, update these lines:
```env
LLM_PROVIDER=deepseek
LLM_API_KEY=your_actual_api_key_here
LLM_MODEL=deepseek-chat
```

**For OpenAI**, use:
```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-your_actual_api_key_here
LLM_MODEL=gpt-4-turbo-preview
```

**For Ollama**, use:
```env
LLM_PROVIDER=ollama
LLM_MODEL=llama2
LLM_BASE_URL=http://localhost:11434
# Leave LLM_API_KEY empty
```

Save and close the file.

## Step 4: Build Shared Package (1 minute)

```bash
# From the project root
cd shared
npm run build
```

This compiles the TypeScript types used by both frontend and backend.

## Step 5: Start the Application (1 minute)

### Option A: Start Both Servers Together
```bash
# From the project root
npm run dev
```

### Option B: Start Servers Separately
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (in a new terminal)
cd frontend
npm run dev
```

You should see:
```
Backend: Server started on port 3001
Frontend: Local: http://localhost:5173
```

## Step 6: Create Your First Prototype (5 minutes)

1. **Open your browser** to http://localhost:5173

2. **Click "New Prototype"**

3. **Enter a name** (optional):
   ```
   My First Landing Page
   ```

4. **Enter a specification**:
   ```
   Create a modern landing page for a project management SaaS tool with:
   
   - A hero section with a catchy headline "Manage Projects Like a Pro", 
     a subheadline about boosting team productivity, and a blue CTA button 
     saying "Start Free Trial"
   
   - A features section with 3 cards:
     * Task Management - Keep track of all your tasks
     * Team Collaboration - Work together seamlessly  
     * Time Tracking - Monitor project progress
   
   - A simple footer with copyright text
   
   Use a modern blue and white color scheme with clean typography.
   ```

5. **Click "Generate from Spec"**

6. **Wait 10-30 seconds** for the AI to generate your prototype

7. **Explore the result!**

## Step 7: Explore the Editor (5 minutes)

Once your prototype is generated, you'll see the editor with four modes:

### Spec Mode
- Add new pages with natural language
- Refine existing content
- Example: "Make the hero section more vibrant"

### Visual Mode
- Click on components to select them
- See the visual layout
- Edit component properties in the right panel

### Code Mode
- View the JSON structure
- Copy code for reference
- Understand the data model

### Preview Mode
- See the final rendered output
- Test interactions
- Navigate between pages

## Step 8: Refine Your Prototype (5 minutes)

Let's make some improvements:

1. **Switch to Spec Mode**

2. **In the "Refine Prototype" section**, enter:
   ```
   Add a pricing section with three tiers:
   - Starter: $9/month
   - Professional: $29/month  
   - Enterprise: Custom pricing
   
   Each tier should have a list of features and a "Choose Plan" button.
   ```

3. **Click "Refine Prototype"**

4. **Wait for the AI** to update your prototype

5. **Switch to Preview Mode** to see the changes

## Step 9: Add a New Page (3 minutes)

1. **In Spec Mode**, scroll to "Add New Page"

2. **Enter**:
   ```
   Create an About Us page with:
   - A heading "About Our Company"
   - A paragraph about our mission to help teams work better
   - A team section with 3 team member cards (use placeholder images)
   - Each card should have a name, role, and short bio
   ```

3. **Click "Generate Page"**

4. **Check the left sidebar** - you should see the new page listed

5. **Click on the new page** to view it

## Step 10: Export Your Prototype (2 minutes)

1. **Click the "Preview" button** in the top toolbar

2. **Review your prototype** in full-screen preview mode

3. **Click "Export HTML"**

4. **Save the file** to your computer

5. **Open the HTML file** in any browser - it works standalone!

## What You've Learned

✅ How to set up the HTML Prototype Builder  
✅ How to configure LLM providers  
✅ How to generate prototypes from specifications  
✅ How to refine and iterate on prototypes  
✅ How to add new pages  
✅ How to export standalone HTML files  

## Next Steps

### Experiment with Different Specifications
Try creating:
- E-commerce product pages
- Dashboard layouts
- Blog templates
- Portfolio sites
- Mobile app mockups

### Explore Advanced Features
- **Version Control**: Create snapshots of your prototypes
- **Component Reuse**: Reference existing components in specs
- **Custom Styling**: Refine colors, fonts, and layouts
- **Interactive Elements**: Add navigation between pages

### Tips for Better Results

1. **Be Specific**: The more detail you provide, the better the results
   - ❌ "Create a homepage"
   - ✅ "Create a homepage with a hero section, 3 feature cards, and a newsletter signup form"

2. **Mention Visual Details**: Describe colors, layouts, and styles
   - ✅ "Use a gradient background from blue to purple"
   - ✅ "Arrange the cards in a 3-column grid"

3. **Iterate Gradually**: Make small refinements rather than large changes
   - ✅ "Make the buttons larger and more rounded"
   - ❌ "Completely redesign everything"

4. **Reference Examples**: Mention similar sites or patterns
   - ✅ "Create a hero section similar to Stripe's homepage"

## Troubleshooting

### "Failed to generate prototype"
- Check your API key is correct in `backend/.env`
- Verify your internet connection
- Check the backend console for error messages
- Ensure you have API credits (for paid providers)

### "Cannot connect to backend"
- Make sure the backend is running on port 3001
- Check for error messages in the backend terminal
- Verify `VITE_API_URL` in `frontend/.env`

### Slow generation
- This is normal! AI generation can take 10-60 seconds
- Complex specifications take longer
- Local models (Ollama) may be slower

### Browser errors
- Clear your browser cache
- Try a different browser
- Check the browser console for errors
- Clear IndexedDB storage if needed

## Getting Help

- **Documentation**: Check `README.md` and `ARCHITECTURE.md`
- **Setup Issues**: Review `SETUP.md`
- **Code Examples**: Look at the generated prototypes
- **Console Logs**: Check browser and server consoles for errors

## What's Next?

Now that you have the basics down, you can:

1. **Build Real Prototypes**: Create prototypes for actual projects
2. **Share with Stakeholders**: Export and share HTML files
3. **Iterate Quickly**: Use AI to rapidly test different designs
4. **Customize the Code**: Extend the application with new features

Happy prototyping! 🚀

