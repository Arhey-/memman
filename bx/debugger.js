/**
 * Created by Arhey on 06.05.2015.
 */

document.addEventListener('DOMContentLoaded', function() {
    var templates = {
            'p': [/\n\s+(.*)/g, '<p>$1</p>'],
            'arrow': [/(=&gt;)/g, '<span class="gray">$1</span>'],
            'false': [/( N| false)/g, '<span class="red">$1</span>'],
            'true': [/(\s(Y|true))</g, '<span class="green">$1</span><'],
            'd': [/(\s\d+)</g, '<span class="blue-true">$1</span><'],
            'f': [/(\s\d+\.\d+)</g, '<span class="blue-true">$1</span><'],
            'date': [/(\s\d+\.\d+\.\d+\s\d+:\d+:\d+)</g, '<span class="blue">$1</span><'],
            'bold': [/(?:\[(ID|CURRENCY)])/g, '[<b>$1</b>]']
        },
        pres = document.getElementsByClassName('debug_bitrix'),
        debug__filter = document.getElementById('debug__filter'),
        pres__p;

    [].forEach.call(pres, function(e){
        var preContent = e.innerHTML;

        for (var template in templates) {
            if (!templates.hasOwnProperty(template)) {
                continue
            }
            preContent = "".replace.apply(preContent, templates[template]);
        }

        e.innerHTML = preContent;
    });

    pres__p = document.querySelectorAll('.debug_bitrix p');

    debug__filter.addEventListener('change', function(){
        var filter = this.value;
        if (filter) {
            [].forEach.call(pres__p, function(p){
                if (~p.textContent.indexOf(filter)) {
                    p.classList.add('ok');
                } else {
                    p.classList.remove('ok');
                }
            });
            pres[0].classList.add('filtration');
        } else {
            pres[0].classList.remove('filtration');
        }
    },false);
}, false);