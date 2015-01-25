/**
 * Created by Arhey on 27.04.2015.
 */

function DriveFile(name) { // todo Все туду будут для Драйва, это узкоспец. скрипт. createNew, noLoad - бит флагами
    this.name = name;

    this.remoteFile = undefined;
    this.content = undefined;

    // todo in Drive.js
    // todo get id, call load manually, not in constructor
    //fixme exist => count of file, choose one and load (else save - create new)
    this._search();
}

DriveFile.prototype.load = function () {
    var file = this.remoteFile,
        self = this;
    if (!file)
        this._search(); //todo with load
    if (file.fileSize > 204800) alert('> 200 kb!');

    if (file.downloadUrl) {
        var accessToken = gapi.auth.getToken().access_token;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', file.downloadUrl);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function() {
            self.content = xhr.responseText;
            try {
                self.content = JSON.parse(self.content);
            } catch (e) {
                alert('bad json');
            }
            if (self.loadDone) {
                self.loadDone();
            }
        };
        xhr.onerror = function() {
            alert('download fail');
        };
        xhr.send();
    } else {
        alert('download fail');
    }
};

DriveFile.prototype.save = function () {
    if (this.remoteFile)
        this.update(); // todo new(folder.files[1].title, DriveFile.NO_SEARCH);
    else
        this.insert();
};

// todo q
DriveFile.prototype._search = function () {
    var self = this;

    gapi.client.load('drive', 'v2', function() {
        var q = gapi.client.drive.files.list({'q': 'title = \'' + self.name + '\' and trashed = false'});
        q.execute(function (resp) {
            var length = resp.items.length;
            if (length) {
                console.log('DriveFile._search: ', resp);
                if (length == 1) {
                    self.remoteFile = resp.items[0];
                    self.load(); // todo загружать ли сразу? Мб файл просто создан для поиска по нему. Флаг в конструктор?
                } else {
                    alert('to many files');
                }
            } else {
                alert('file not exist, but save create new');
            }
        });
    });
};

DriveFile.prototype.update = function (callback) {
    //todo insert/update: method: post/put, path+-fileId, blob both variants, blobToBase64_
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var blob = new Blob([JSON.stringify(this.content)], {type: "text/json"}),
        self = this;
    var reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = function(e) {
        blob = null;
        var dataUrl = reader.result,
            base64Data = dataUrl.split(',')[1],
            contentType = 'application/json',
            metadata = {
                'title': self.name,
                'mimeType': contentType
            };

        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files/' + self.remoteFile.id,
            'method': 'PUT',
            'params': {'uploadType': 'multipart', 'alt': 'json'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});
        if (!callback) {
            callback = function(file) {
                console.log(file)
            };
        }
        request.execute(callback);
    }
};
