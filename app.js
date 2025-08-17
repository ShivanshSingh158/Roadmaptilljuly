// Study Plan Tracker Application
class StudyPlanTracker {
    constructor(data) {
        this.data = data;
        this.taskStates = new Map(); // Map to store task completion states
        this.init();
    }

    init() {
        this.renderAccordion();
        this.attachEventListeners();
        this.updateAllProgress();
    }

    generateTaskId(monthIndex, weekIndex, taskIndex) {
        return `task-${monthIndex}-${weekIndex}-${taskIndex}`;
    }

    renderAccordion() {
        const accordion = document.getElementById('months-accordion');
        accordion.innerHTML = '';

        this.data.months.forEach((month, monthIndex) => {
            const monthElement = this.createMonthElement(month, monthIndex);
            accordion.appendChild(monthElement);
        });
    }

    createMonthElement(month, monthIndex) {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        accordionItem.setAttribute('data-month-index', monthIndex);

        const header = document.createElement('button');
        header.className = 'accordion-header';
        header.setAttribute('aria-expanded', 'false');
        header.setAttribute('aria-controls', `month-content-${monthIndex}`);
        header.innerHTML = `
            <span>${month.name}</span>
            <span class="accordion-chevron">▼</span>
        `;

        const content = document.createElement('div');
        content.className = 'accordion-content';
        content.id = `month-content-${monthIndex}`;
        content.setAttribute('aria-labelledby', `month-header-${monthIndex}`);

        // Month progress bar
        const monthProgress = document.createElement('div');
        monthProgress.className = 'month-progress';
        monthProgress.innerHTML = `
            <div class="month-progress-label">Month Progress</div>
            <div class="month-progress-bar">
                <div class="month-progress-fill" id="month-progress-${monthIndex}"></div>
            </div>
            <div class="month-progress-text" id="month-progress-text-${monthIndex}">0% complete</div>
        `;

        // Weeks container
        const weeksContainer = document.createElement('div');
        weeksContainer.className = 'weeks-container';

        month.weeks.forEach((week, weekIndex) => {
            const weekElement = this.createWeekElement(week, monthIndex, weekIndex);
            weeksContainer.appendChild(weekElement);
        });

        content.appendChild(monthProgress);
        content.appendChild(weeksContainer);
        accordionItem.appendChild(header);
        accordionItem.appendChild(content);

        return accordionItem;
    }

    createWeekElement(week, monthIndex, weekIndex) {
        const weekCard = document.createElement('div');
        weekCard.className = 'week-card';

        const fieldset = document.createElement('fieldset');
        fieldset.className = 'week-fieldset';

        const legend = document.createElement('legend');
        legend.className = 'week-legend';
        legend.innerHTML = `
            <span>${week.name}</span>
            <button class="btn btn--sm btn--outline week-complete-btn" data-month="${monthIndex}" data-week="${weekIndex}">
                Mark Week Complete
            </button>
        `;

        const tasksList = document.createElement('div');
        tasksList.className = 'tasks-list';

        week.tasks.forEach((task, taskIndex) => {
            const taskId = this.generateTaskId(monthIndex, weekIndex, taskIndex);
            const taskItem = this.createTaskElement(task, taskId, monthIndex, weekIndex, taskIndex);
            tasksList.appendChild(taskItem);
        });

        fieldset.appendChild(legend);
        fieldset.appendChild(tasksList);
        weekCard.appendChild(fieldset);

        return weekCard;
    }

    createTaskElement(task, taskId, monthIndex, weekIndex, taskIndex) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.setAttribute('data-task-id', taskId);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = taskId;
        checkbox.className = 'task-checkbox';
        checkbox.setAttribute('data-month', monthIndex);
        checkbox.setAttribute('data-week', weekIndex);
        checkbox.setAttribute('data-task', taskIndex);

        const label = document.createElement('label');
        label.className = 'task-label';
        label.setAttribute('for', taskId);
        label.textContent = task;

        taskItem.appendChild(checkbox);
        taskItem.appendChild(label);

        return taskItem;
    }

    attachEventListeners() {
        // Accordion toggle - fixed to handle clicks on child elements
        document.addEventListener('click', (e) => {
            const accordionHeader = e.target.closest('.accordion-header');
            if (accordionHeader) {
                this.toggleAccordion(accordionHeader);
            }
        });

        // Checkbox changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                this.handleTaskToggle(e.target);
            }
        });

        // Week complete buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('week-complete-btn')) {
                e.stopPropagation(); // Prevent accordion toggle
                this.markWeekComplete(e.target);
            }
        });

        // Reset all button
        document.getElementById('reset-all-btn').addEventListener('click', () => {
            this.resetAllProgress();
        });

        // Keyboard navigation for accordion
        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('accordion-header') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this.toggleAccordion(e.target);
            }
        });
    }

    toggleAccordion(header) {
        const accordionItem = header.closest('.accordion-item');
        const isExpanded = accordionItem.classList.contains('expanded');
        
        // Close all other accordion items
        document.querySelectorAll('.accordion-item.expanded').forEach(item => {
            if (item !== accordionItem) {
                item.classList.remove('expanded');
                const otherHeader = item.querySelector('.accordion-header');
                otherHeader.setAttribute('aria-expanded', 'false');
            }
        });

        // Toggle current item
        if (isExpanded) {
            accordionItem.classList.remove('expanded');
            header.setAttribute('aria-expanded', 'false');
        } else {
            accordionItem.classList.add('expanded');
            header.setAttribute('aria-expanded', 'true');
        }
    }

    handleTaskToggle(checkbox) {
        const taskId = checkbox.id;
        const taskItem = checkbox.closest('.task-item');
        
        // Update task state
        this.taskStates.set(taskId, checkbox.checked);
        
        // Update visual state
        if (checkbox.checked) {
            taskItem.classList.add('completed');
        } else {
            taskItem.classList.remove('completed');
        }

        // Update progress bars
        const monthIndex = parseInt(checkbox.getAttribute('data-month'));
        this.updateMonthProgress(monthIndex);
        this.updateOverallProgress();
    }

    markWeekComplete(button) {
        const monthIndex = parseInt(button.getAttribute('data-month'));
        const weekIndex = parseInt(button.getAttribute('data-week'));
        
        // Find all checkboxes in this week
        const checkboxes = document.querySelectorAll(
            `input[data-month="${monthIndex}"][data-week="${weekIndex}"]`
        );
        
        // Check all boxes in the week
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                this.handleTaskToggle(checkbox);
            }
        });
    }

    updateMonthProgress(monthIndex) {
        const month = this.data.months[monthIndex];
        let totalTasks = 0;
        let completedTasks = 0;

        month.weeks.forEach((week, weekIndex) => {
            week.tasks.forEach((task, taskIndex) => {
                totalTasks++;
                const taskId = this.generateTaskId(monthIndex, weekIndex, taskIndex);
                if (this.taskStates.get(taskId)) {
                    completedTasks++;
                }
            });
        });

        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const progressFill = document.getElementById(`month-progress-${monthIndex}`);
        const progressText = document.getElementById(`month-progress-text-${monthIndex}`);
        
        if (progressFill && progressText) {
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${percentage}% complete (${completedTasks}/${totalTasks} tasks)`;
        }
    }

    updateOverallProgress() {
        let totalTasks = 0;
        let completedTasks = 0;

        this.data.months.forEach((month, monthIndex) => {
            month.weeks.forEach((week, weekIndex) => {
                week.tasks.forEach((task, taskIndex) => {
                    totalTasks++;
                    const taskId = this.generateTaskId(monthIndex, weekIndex, taskIndex);
                    if (this.taskStates.get(taskId)) {
                        completedTasks++;
                    }
                });
            });
        });

        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const progressFill = document.getElementById('overall-progress-fill');
        const progressText = document.getElementById('overall-progress-text');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% (${completedTasks}/${totalTasks} tasks)`;
    }

    updateAllProgress() {
        // Update all month progress bars
        this.data.months.forEach((month, monthIndex) => {
            this.updateMonthProgress(monthIndex);
        });
        
        // Update overall progress
        this.updateOverallProgress();
    }

    resetAllProgress() {
        // Clear all task states
        this.taskStates.clear();
        
        // Uncheck all checkboxes and remove completed styling
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            const taskItem = checkbox.closest('.task-item');
            if (taskItem) {
                taskItem.classList.remove('completed');
            }
        });
        
        // Update all progress bars
        this.updateAllProgress();
    }
}

// Study plan data
const studyPlanData = {"months":[{"name":"August 2025","weeks":[{"name":"Week 2 (Aug 18–24)","tasks":["Revise Array basics (insertion, deletion, searching)","Solve basic array problems (reverse, min/max, rotation, subarray sum)","Revise HTML basics (semantic tags, forms)"]},{"name":"Week 3 (Aug 25–31)","tasks":["Learn Kadane's Algorithm & 2-pointer patterns","Revise all array questions & mark weak spots","Learn CSS basics & responsive design (box model, flex, grid, media queries)"]}]},{"name":"September 2025","weeks":[{"name":"Week 1 (Sep 1–7)","tasks":["Singly Linked List operations","CSS positioning, Flexbox, Grid layouts","Create landing page layout"]},{"name":"Week 2 (Sep 8–14)","tasks":["Doubly & Circular Linked Lists","Responsive design, CSS animations, theme toggle","Upload mini project to GitHub"]},{"name":"Week 3 (Sep 15–21)","tasks":["Stacks & Queues implementations","JavaScript basics (variables, loops, functions)","String methods & template literals"]},{"name":"Week 4 (Sep 22–30)","tasks":["HashMap basics & problems","DOM basics + mini project (form validation)","HTML, CSS, JS revision"]}]},{"name":"October 2025","weeks":[{"name":"Week 1 (Oct 1–7)","tasks":["Hashing problem set + DS revision","JS functions, ES6 features","Array methods (map, filter, reduce)"]},{"name":"Week 2 (Oct 8–14)","tasks":["Mid-term exams: 1 easy DSA problem/day","30 min JS practice/day","Light revision of previous topics"]},{"name":"Week 3 (Oct 15–18)","tasks":["Sorting basics (Bubble, Selection, Insertion)","DOM deep dive (createElement, appendChild)","Event bubbling & delegation"]},{"name":"Week 4 (Oct 19–26)","tasks":["Quick & Heap Sort, Binary Search variations","Promises & async/await","Fetch API mini project"]},{"name":"Week 5 (Oct 27–31)","tasks":["Binary Search practice set","Sorting/Searching mixed problems","Build small JS game (Guess Number)"]}]},{"name":"November 2025","weeks":[{"name":"Week 1 (Nov 1–7)","tasks":["Binary Search advanced problems","Binary Tree basics & traversals","JS objects/classes & Notes app"]},{"name":"Week 2 (Nov 8–14)","tasks":["BST operations & LCA","Async JS & Weather API project","DBMS revision start"]},{"name":"Week 3 (Nov 15–21)","tasks":["AVL Trees & tree problem practice","GitHub user search project","JS comprehensive revision"]},{"name":"Week 4 (Nov 22–25)","tasks":["Mixed DSA revision","Final vanilla JS project","Upload projects & polish portfolio"]}]},{"name":"December 2025","weeks":[{"name":"Weeks 1–2 (Dec 1–10)","tasks":["End-sem exams – minimal coding: 1 easy DSA problem/day","Quick JS/HTML note review"]},{"name":"Week 3 (Dec 11–15)","tasks":["Binary Tree & BST revision","Review JS Promises & Fetch"]},{"name":"Week 4 (Dec 16–22)","tasks":["Tree advanced problems","Graphs basics (BFS/DFS)","React basics: components & state"]},{"name":"Week 5 (Dec 23–31)","tasks":["Shortest path algorithms (Dijkstra, Bellman-Ford)","Graph practice set","React project + deploy"]}]},{"name":"January 2026","weeks":[{"name":"Weeks 1–2 (Jan 1–11)","tasks":["MST algorithms (Prim, Kruskal)","Backtracking basics (N-Queens)","React Context & custom hooks","Deploy Notes app"]},{"name":"Week 3 (Jan 12–18)","tasks":["Backtracking problem set","TypeScript fundamentals","Integrate TS with React"]},{"name":"Week 4 (Jan 19–25)","tasks":["DP basics (Fibonacci, Knapsack)","React+TS Weather App","Performance optimization"]},{"name":"Week 5 (Jan 26–31)","tasks":["DP advanced (Coin Change, LCS)","Next.js basics & dynamic pages","Build basic blog"]}]},{"name":"February 2026","weeks":[{"name":"Week 1 (Feb 1–7)","tasks":["DP memoization vs tabulation","Next.js routing & data fetching","Blog project MVP"]},{"name":"Week 2 (Feb 8–14)","tasks":["DP intermediate (LCS, LIS, Matrix Chain)","Node.js & Express basics","REST API mini project"]},{"name":"Week 3 (Feb 15–21)","tasks":["DP on strings/grids/stocks","MongoDB & Mongoose","User CRUD API with DB"]},{"name":"Week 4 (Feb 22–28)","tasks":["Advanced DP + bitmasking","MERN stack Todo app with JWT","Deploy API"]}]},{"name":"March 2026","weeks":[{"name":"Week 1 (Mar 1–7)","tasks":["Greedy basics (Activity Selection, Job Sequencing)","JWT auth flow & hashing","User Auth API"]},{"name":"Week 2 (Mar 8–14)","tasks":["Greedy intervals & strings","Next.js middleware & DB integration","Blog w/ Next.js + DB"]},{"name":"Week 3 (Mar 15–21)","tasks":["Mid-sem exams – daily light revision","Bug-fix projects & review"]},{"name":"Week 4 (Mar 22–31)","tasks":["Hard DSA problem marathon","Full-stack E-commerce (cart, payments)","Deploy e-commerce project"]}]},{"name":"April 2026","weeks":[{"name":"Week 1 (Apr 1–7)","tasks":["Tries & autocomplete problems","Express middleware & error handling","File upload microservice"]},{"name":"Week 2 (Apr 8–14)","tasks":["Segment & Fenwick Trees","Social Media backend setup","Auth implementation"]},{"name":"Week 3 (Apr 15–21)","tasks":["Union-Find & DSU problems","Add feed, likes, comments","Deploy social media backend"]},{"name":"Week 4 (Apr 22–30)","tasks":["Advanced DP (digit/bitmask)","Mock coding contests","CI/CD with GitHub Actions"]}]},{"name":"May 2026","weeks":[{"name":"Week 1 (May 1–7)","tasks":["DP & Graph quick revision","Polish social media project","DBMS/OS/CN fundamentals","Daily aptitude practice"]},{"name":"Week 2 (May 8–14)","tasks":["DSA mixed revision","Next.js & MERN revision","Core subjects deep dive","Aptitude mocks"]},{"name":"Weeks 3–4 (May 15–31)","tasks":["End-sem exams – minimal coding","Focus on DBMS, OS, CN notes","20-30 min aptitude/day"]}]},{"name":"June 2026","weeks":[{"name":"Week 1 (Jun 1–7)","tasks":["Segment Tree & Trie recap","REST vs GraphQL","Secure JWT & cookies","DBMS/OS/CN recap"]},{"name":"Week 2 (Jun 8–14)","tasks":["Advanced DP (Tree/Graph DP)","Full-stack Project 1 setup","Core subjects revision","Aptitude reasoning"]},{"name":"Week 3 (Jun 15–21)","tasks":["Lazy propagation, KMP, Z-algo","Add realtime features (Socket.io)","Mock coding contest","Core Q/A session"]},{"name":"Week 4 (Jun 22–30)","tasks":["DSA mega revision sprint","System design basics (caching, scaling)","Mock interviews & contests","Core subjects MCQ tests"]}]},{"name":"July 2026","weeks":[{"name":"Week 1 (Jul 1–7)","tasks":["Arrays & Strings revision contest","Deploy all projects & docs","DBMS/OS/CN quick notes","Quant basics"]},{"name":"Week 2 (Jul 8–14)","tasks":["DP & Graphs revision","System design scenarios","Core subjects mock test","Puzzles & reasoning"]},{"name":"Week 3 (Jul 15–21)","tasks":["Daily coding contests","Portfolio & resume final polish","Full MCQ test (100 Qs)","Daily aptitude full mocks"]}]}]};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudyPlanTracker(studyPlanData);
});