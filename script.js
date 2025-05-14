// Configuration: GitHub user, repo, and branch for content
const GH_USER = 'YOUR_GITHUB_USERNAME';
const GH_REPO = 'YOUR_REPOSITORY_NAME';
const GH_BRANCH = 'main';  // e.g., 'gh-pages' if using that branch for Pages

// Paths to content folders in the repo
const DATAMINE_PATH = 'datamine';
const PATCH_PATH = 'patchnotes';

// Utility: Format a "YYYY-MM-DD" date string to a nicer format like "Month Day, Year"
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const monthNames = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
  const monthIndex = parseInt(m, 10) - 1;
  const monthName = monthNames[monthIndex] || m;
  // Remove any leading zero from day for neatness
  const dayNum = d.startsWith('0') ? d.slice(1) : d;
  return `${monthName} ${dayNum}, ${y}`;
}

// Fetch and render markdown files for a given section
async function loadSection(path, listContainerId) {
  const apiUrl = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error('Failed to fetch list from ' + path, response.status);
      return;
    }
    const files = await response.json();
    // Filter to only Markdown files (ends with .md)
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    // Sort files by name in descending order so newest (highest date) comes first
    mdFiles.sort((a, b) => b.name.localeCompare(a.name));
    for (const file of mdFiles) {
      // Fetch the raw content of each Markdown file
      const fileResp = await fetch(file.download_url);
      const mdText = await fileResp.text();
      // Convert Markdown text to HTML string
      const htmlContent = marked.parse(mdText);
      // Sanitize the HTML string (remove any unsafe tags/scripts)
      const cleanContent = DOMPurify.sanitize(htmlContent);
      // Create the collapsible entry elements
      const detailsElem = document.createElement('details');
      const summaryElem = document.createElement('summary');
      // Use the date (from filename) as the summary text
      const datePart = file.name.substring(0, 10); // "YYYY-MM-DD"
      summaryElem.textContent = formatDate(datePart);
      // Create a container for the HTML content and insert the sanitized HTML
      const contentDiv = document.createElement('div');
      contentDiv.className = 'detail-content';
      contentDiv.innerHTML = cleanContent;
      // Assemble the elements
      detailsElem.appendChild(summaryElem);
      detailsElem.appendChild(contentDiv);
      // Append to the appropriate section list in the page
      document.getElementById(listContainerId).appendChild(detailsElem);
    }
  } catch (err) {
    console.error('Error loading section ' + path + ':', err);
  }
}

// Load both sections on page load
loadSection(DATAMINE_PATH, 'datamine-list');
loadSection(PATCH_PATH, 'patch-list');