require('dotenv').config()
const { google } = require('googleapis')

const googleauth = new google.auth.GoogleAuth({
    keyFile: './credentials.json',
    scopes: ['https://www.googleapis.com/auth/drive']
})

const drive = google.drive({
    version: 'v3',
    auth: googleauth
})

async function exportLinesFromFile (fileId) {
    let lines = []
    try {
        const result = await drive.files.export({
            fileId: fileId,
            mimeType: 'text/plain',
            alt: 'media'
        })
        lines = result.data.split('\r\n')
    } catch (error) {
        console.error('GoogleDriveAPI: The file cannot be exported! \n' + error)
    }
    return lines
}

async function getFiles (folderId) {
    try {
        const res = await drive.files.list({
            q: "'" + folderId + "' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id,mimeType,name,size,webContentLink,webViewLink),nextPageToken'
        })
        return res.data.files
    } catch (error) {
        console.error(`GoogleDriveAPI: No files are found in the folder by '${folderId}'! \n` + error)
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
        console.error(`GoogleDriveAPI: No folders are found in the folder by '${folderId}'! \n` + error)
    }
}

function getFileUrl (fileId) {
    // for embed > `https://drive.google.com/file/d/${fileId}/preview`
    // for direct link > `https://drive.google.com/uc?export=view&id=${fileId}`
    // for share > `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    // `https://drive.google.com/uc?id=${fileId}`

    return `https://drive.google.com/uc?export=view&id=${fileId}`
}

module.exports = {
    getFiles,
    getFolders,
    getFileUrl,
    exportLinesFromFile
}
