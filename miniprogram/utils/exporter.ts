/**
 * CSV Export Utility for AutoRepo
 * Generates CSV files with UTF-8 BOM for Excel compatibility
 * Uses WeChat FileSystemManager for local storage and sharing
 */

interface ExportCommit {
  _id?: string;
  title: string;
  type: string;
  mileage: number;
  timestamp: number;
  cost_parts?: number;
  cost_labor?: number;
  message?: string;
  date?: string;
}

/**
 * Export maintenance records to CSV file
 * @param commits - Array of commit records to export
 * @param repoName - Vehicle name for filename
 */
export const exportToCSV = (commits: ExportCommit[], repoName: string) => {
  // CSV header (Chinese column names)
  const BOM = '\ufeff'; // UTF-8 BOM for Excel compatibility
  let csv = BOM + '日期,类型,标题,里程(km),零件费用(元),人工费用(元),总费用(元),备注\n';

  // Type mapping
  const typeMap: { [key: string]: string } = {
    maintenance: '保养',
    repair: '维修',
    modification: '改装'
  };

  // Generate rows
  commits.forEach(commit => {
    const date = commit.date || formatDate(commit.timestamp);
    const type = typeMap[commit.type] || commit.type;
    const title = escapeCSV(commit.title);
    const mileage = commit.mileage || 0;
    const costParts = commit.cost_parts || 0;
    const costLabor = commit.cost_labor || 0;
    const totalCost = costParts + costLabor;
    const message = escapeCSV(commit.message || '');

    csv += `${date},${type},${title},${mileage},${costParts},${costLabor},${totalCost},${message}\n`;
  });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedRepoName = repoName.replace(/[^\w\u4e00-\u9fa5]/g, '_');
  const fileName = `${sanitizedRepoName}_维保记录_${timestamp}.csv`;

  // Save file using WeChat FileSystemManager
  const fs = wx.getFileSystemManager();
  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

  return new Promise<string>((resolve, reject) => {
    fs.writeFile({
      filePath,
      data: csv,
      encoding: 'utf8',
      success: () => {
        resolve(filePath);
      },
      fail: (err: any) => {
        console.error('Failed to write CSV file:', err);
        reject(new Error('文件保存失败'));
      }
    });
  });
};

/**
 * Share CSV file via WeChat
 * @param filePath - Path to the CSV file
 */
export const shareCSV = (filePath: string) => {
  return new Promise<void>((resolve, reject) => {
    wx.shareFileMessage({
      filePath,
      success: () => {
        wx.showToast({
          title: '分享成功',
          icon: 'success'
        });
        resolve();
      },
      fail: (err: any) => {
        console.error('Failed to share file:', err);
        
        // Fallback: Open file with default app
        wx.openDocument({
          filePath,
          showMenu: true,
          success: () => {
            wx.showToast({
              title: '已打开文件',
              icon: 'success'
            });
            resolve();
          },
          fail: (openErr: any) => {
            console.error('Failed to open document:', openErr);
            reject(new Error('分享失败'));
          }
        });
      }
    });
  });
};

/**
 * Escape CSV special characters (quotes, commas)
 */
const escapeCSV = (value: string): string => {
  if (!value) return '';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
};

/**
 * Format timestamp to YYYY-MM-DD
 */
const formatDate = (timestamp: number): string => {
  if (!timestamp) return '--';
  
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
