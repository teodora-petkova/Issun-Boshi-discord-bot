require('dotenv').config()
const { google } = require('googleapis')

const drive = google.drive({
    version: 'v3',
    auth: process.env.GOOGLE_API_KEY
})

async function exportLinesFromFile (fileId) {
    try {
        const result = await drive.files.export({
            fileId: fileId,
            mimeType: 'text/plain',
            alt: 'media'
        })
        return result.data.split('\r\n')
    } catch (error) {
        console.log('GoogleDriveAPI: The file cannot be exported! \n' + error)
    }
}

async function getFiles (folderId) {
    try {
        const res = await drive.files.list({
            q: "'" + folderId + "' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id,mimeType,name,size,webContentLink,webViewLink),nextPageToken'
        })
        return res.data.files
    } catch (error) {
        console.log(`GoogleDriveAPI: No files are found in the folder by '${folderId}'! \n` + error)
    }
}

async function getFolders (folderId) {
    try {
        const res = await drive.files.list({
            q: "'" + folderId + "' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id,mimeType,name,size),nextPageToken'
        })
        return res.data.files
    } catch (error) {
        console.log(`GoogleDriveAPI: No folders are found in the folder by '${folderId}'! \n` + error)
    }
}

function getFileUrl (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`
}

module.exports = {
    getFiles,
    getFolders,
    getFileUrl,
    exportLinesFromFile
}
