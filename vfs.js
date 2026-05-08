/**
 * BoatOS Virtual Filesystem (VFS)
 * Inspired by AnuraOS's synced filesystem
 */
const VFS = {
  root: {
    type: 'dir',
    children: {
      'home': {
        type: 'dir',
        children: {
          'user': {
            type: 'dir',
            children: {
              'welcome.txt': { type: 'file', content: 'Welcome to BoatOS!\nTry typing "help" in the terminal.' }
            }
          }
        }
      },
      'bin': { type: 'dir', children: {} },
      'etc': { type: 'dir', children: {} }
    }
  },

  init() {
    const saved = localStorage.getItem('boatos_vfs');
    if (saved) {
      try {
        this.root = JSON.parse(saved);
      } catch (e) {
        console.error('VFS Load Error', e);
      }
    }
  },

  save() {
    localStorage.setItem('boatos_vfs', JSON.stringify(this.root));
  },

  // Helper to navigate path string to node object
  getNode(path) {
    if (path === '/') return this.root;
    const parts = path.split('/').filter(p => p);
    let current = this.root;
    for (const part of parts) {
      if (!current.children || !current.children[part]) return null;
      current = current.children[part];
    }
    return current;
  },

  // List directory contents
  ls(path) {
    const node = this.getNode(path);
    if (!node || node.type !== 'dir') return null;
    return Object.keys(node.children).map(name => ({
      name,
      type: node.children[name].type
    }));
  },

  // Read file content
  cat(path) {
    const node = this.getNode(path);
    if (!node || node.type !== 'file') return null;
    return node.content;
  },

  // Write file content
  write(path, content) {
    const parts = path.split('/').filter(p => p);
    const fileName = parts.pop();
    const dirPath = '/' + parts.join('/');
    const dirNode = this.getNode(dirPath);
    
    if (!dirNode || dirNode.type !== 'dir') return false;
    
    dirNode.children[fileName] = { type: 'file', content };
    this.save();
    return true;
  },

  // Create directory
  mkdir(path) {
    const parts = path.split('/').filter(p => p);
    const dirName = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parentNode = this.getNode(parentPath);

    if (!parentNode || parentNode.type !== 'dir') return false;
    if (parentNode.children[dirName]) return false; // Already exists

    parentNode.children[dirName] = { type: 'dir', children: {} };
    this.save();
    return true;
  }
};

// Initialize VFS on load
VFS.init();