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
  const BOM = '\ufeff';
  let csv = BOM + '日期,类型,标题,里程(km),费用(元),备注\n';

  const typeMap: { [key: string]: string } = {
    maintenance: '保养',
    repair: '维修',
    modification: '改装',
    preparation: '整备',
    insurance: '保险'
  };

  commits.forEach(commit => {
    const date = formatDate(commit.timestamp);
    const type = typeMap[commit.type] || commit.type;
    const title = escapeCSV(commit.title);
    const mileage = commit.mileage || 0;
    const costParts = commit.cost?.parts || 0;
    const costLabor = commit.cost?.labor || 0;
    const totalCost = costParts + costLabor;
    const message = escapeCSV(commit.message || '');

    csv += `${date},${type},${title},${mileage},${totalCost},${message}\n`;
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}${month}${day}_${hour}${minute}${second}`;
  
  const sanitizedRepoName = repoName.replace(/[^\w\u4e00-\u9fa5]/g, '_');
  const fileName = `${sanitizedRepoName}_${timestamp}.xls`;

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
        
        if (err.errMsg && err.errMsg.includes('EBUSY')) {
          reject(new Error('文件被占用，请关闭已打开的Excel文件后重试'));
        } else {
          reject(new Error(`文件保存失败: ${err.errMsg || '未知错误'}`));
        }
      }
    });
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
          fileType: 'xls',
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
