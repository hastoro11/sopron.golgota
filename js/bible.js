$(function () {
  (function ($) {
    var bible = (function () {
      // variables
      var books = [];
      var bibles = [];
      var current = {
        book: {}
        , chapter: 0
        , bible: {}
      };
      var results = [];
      var baseUrl = 'http://szentiras.hu/api/';

      function init() {
        //
        loadData();
      }

      function loadData() {
        //
        fetch('js/bibles.json').then(function (response) {
          return response.json();
        }).then(function (data) {
          books = data.books;
          bibles = data.bibles;
          setCurrent('1Móz', 1, 'RUF');
          view.renderTitlePage(books, current);
        });
      }

      function getBooks() {
        return books;
      }

      function getBibles() {
        return bibles;
      }

      function getChapter(active) {
        //
        var url = baseUrl + 'idezet/' + current.book.abbrev + current.chapter + '/' + current.bible.abbrev;
        $.get(url).then(function (data) {
          var verses = data.valasz.versek;
          view.renderReader(verses, active);
        })
      }

      function setCurrent(bookAbbrev, chapter, bibleAbbrev) {
        if (bookAbbrev) {
          current.book = books.find(function (book) {
            return book.abbrev === bookAbbrev;
          });
        }
        if (chapter) {
          current.chapter = chapter;
        }
        if (bibleAbbrev) {
          current.bible = bibles.find(function (bible) {
            return bible.abbrev === bibleAbbrev;
          });
        }
      }

      function incrementChapter() {
        current.chapter++;
      }

      function decrementChapter() {
        current.chapter--;
      }

      function getCurrent() {
        return current;
      }

      function getResults() {
        return results;
      }

      function searchPhrase(phrase) {
        var url = baseUrl + 'search/' + phrase;
        $.get(url).then(function (data) {
          if (!data.fullTextResult) {
            view.renderSearchResults(null, phrase);
            return;
          }
          var results = data.fullTextResult.results.filter(function (result) {
            return result.translation.abbrev === current.bible.abbrev;
          });
          view.renderSearchResults(results, phrase);
        })
      }
      return {
        init: init
        , getBibles: getBibles
        , getBooks: getBooks
        , getCurrent: getCurrent
        , setCurrent: setCurrent
        , getChapter: getChapter
        , incrementChapter: incrementChapter
        , decrementChapter: decrementChapter
        , searchPhrase: searchPhrase
        , getResults: getResults
      }
    })();
    var view = (function () {
      // views
      var $read = $('#read');
      var $books = $('#books');
      var $searchList = $('#searchList');
      // buttons
      var $btnBook = $('#btnBook');
      var $btnChapter = $('#btnChapter');
      var $btnBible = $('#btnBible');
      var $btnPrev = $('#btnPrev');
      var $btnNext = $('#btnNext');
      // modals
      var $bookModal = $('#bookModal')
        , $chapterModal = $('#chapterModal')
        , $bibleModal = $('#bibleModal');
      var $phrase = $('#txtSearch')
        , $btnSearch = $('#btnSearch')
        , $btnSearchResults = $('#btnSearchResults');

      function init() {
        setUpListeners();
      }

      function setUpListeners() {
        // arrow buttons
        $btnPrev.on('click', function (evt) {
          bible.decrementChapter();
          bible.getChapter();
        });
        $btnNext.on('click', function (evt) {
          bible.incrementChapter();
          bible.getChapter();
        });
        // book button
        $btnBook.on('click', function (evt) {
          $bookModal.modal('show');
          showBookModal();
        });
        // chapter button
        $btnChapter.on('click', function (evt) {
          $chapterModal.modal('show');
          showChapterModal();
        });
        // bible button
        $btnBible.on('click', function (evt) {
          $bibleModal.modal('show');
          showBibleModal();
        });
        //search button        
        $btnSearch.on('click', function (evt) {
          var phrase = $phrase.val();
          if (phrase.length === 0) {
            alert('A keresett kifejezés legalább egy karakter hosszúságú legyen');
            return;
          }
          bible.searchPhrase(phrase);
        })
      }

      function renderTitlePage(books) {
        // hide other sections      
        $read.addClass('hidden');
        $searchList.addClass('hidden');
        $books.removeClass('hidden');
        //
        var $oldTest = $('ul.oldTest');
        var $newTest = $('ul.newTest');
        $oldTest.html('');
        $newTest.html('');
        books.forEach(function (book, index) {
          var $li = $('<li>').append($('<a href="#" data-book="' + book.abbrev + '" data-chapter="1">').html(book.name));
          $li.find('a').on('click', function (evt) {
            //                    
            bible.setCurrent($(this).data('book'), $(this).data('chapter'));
            bible.getChapter();
          })
          if (index < 39) {
            $oldTest.append($li);
          }
          else {
            $newTest.append($li);
          }
        });
        //
        renderControlButtons(true);
      }

      function renderControlButtons(isTitlePage = false) {
        //
        $btnBook.html(bible.getCurrent().book.abbrev);
        $btnChapter.html(bible.getCurrent().chapter);
        $btnBible.html(bible.getCurrent().bible.abbrev);
        if (isTitlePage || bible.getCurrent().book.chapters === 1) {
          $btnPrev.addClass('disabled');
          $btnNext.addClass('disabled');
        }
        else {
          if (bible.getCurrent().chapter === 1) {
            $btnPrev.addClass('disabled');
            $btnNext.removeClass('disabled');
          }
          else if (bible.getCurrent().chapter === bible.getCurrent().book.chapters) {
            $btnPrev.removeClass('disabled');
            $btnNext.addClass('disabled');
          }
          else {
            $btnPrev.removeClass('disabled');
            $btnNext.removeClass('disabled');
          }
        }
      }

      function renderReader(verses, active) {
        //
        var str = '';
        verses.forEach(function (vers, index) {
          var v = vers.szoveg.replace(/&lt;br&gt;/g, '');
          if (active === index + 1) {
            str += '<span class="bg-warning"><sup>' + (index + 1) + '</sup>' + ' ' + v + '</span>';
          }
          else {
            str += '<span><sup>' + (index + 1) + '</sup>' + ' ' + v + '</span>';
          }
        });
        str = '<span class="init">' + bible.getCurrent().chapter + '</span>' + str;
        $read.find('.verses').html(str);
        // hide other sections      
        $read.removeClass('hidden');
        $searchList.addClass('hidden');
        $books.addClass('hidden');
        //
        renderControlButtons();
      }

      function renderSearchResults(results, phrase) {
        var $phrase = $('#phrase')
          , $resultDiv = $('#searchResults')
          , $count = $('#count')
          , count = 0;
        $resultDiv.html('');
        $phrase.html(phrase);
        if (!results) {
          $count.html(count + ' találat');
          // hide other sections      
          $read.addClass('hidden');
          $searchList.removeClass('hidden');
          $books.addClass('hidden');
          return;
        }
        results.forEach(function (book) {
          var b = book.abbrev;
          book.verses.forEach(function (vers) {
            count++;
            var $bq = $('<blockquote>');
            $bq.append($('<p>').append('<sup>' + vers.numv + '</sup>' + vers.text));
            $bq.append($('<footer>').append('<a href="#" data-book="' + book.book.abbrev + '" data-chapter="' + vers.chapter + '" data-numv="' + vers.numv + '">' + book.book.abbrev + vers.chapter + ',' + vers.numv + '</a>'));
            $resultDiv.append($bq);
          });
        });
        $count.html(count + ' találat');
        // hide other sections      
        $read.addClass('hidden');
        $searchList.removeClass('hidden');
        $books.addClass('hidden');
        // listeners
        $resultDiv.find('a').on('click', function (evt) {
          evt.preventDefault();
          var book = $(this).data('book')
            , chapter = $(this).data('chapter')
            , numv = $(this).data('numv');
          bible.setCurrent(book, chapter);
          bible.getChapter(numv);
        });
      }

      function showBookModal() {
        // variables
        var $header = $bookModal.find('.modal-header')
          , $body = $bookModal.find('.modal-body')
          , $footer = $bookModal.find('.modal-footer')
          , books = bible.getBooks();
        $body.html('');
        $footer.addClass('hidden');
        books.forEach(function (book, index) {
          if (index < books.length - 1) {
            $body.append('<span><a href="#" data-book="' + book.abbrev + '" data-chapters="' + book.chapters + '">' + book.abbrev + '</a> - </span>');
          }
          else {
            $body.append('<span><a href="#" data-book="' + book.abbrev + '" data-chapters="' + book.chapters + '">' + book.abbrev + '</a></span>');
          }
        });
        $body.find('a').on('click', function (evt) {
          evt.preventDefault();
          $footer.html('');
          var book = $(this).data('book')
            , chapters = $(this).data('chapters');
          for (var i = 1; i <= chapters; i++) {
            $footer.append('<span> <a href="#" data-book="' + book + '" data-chapter="' + i + '">' + i + '</a></span>');
          }
          $footer.removeClass('hidden');
          $footer.find('a').on('click', function (evt) {
            evt.preventDefault();
            $bookModal.modal('hide');
            var book = $(this).data('book')
              , chapter = $(this).data('chapter');
            bible.setCurrent(book, chapter);
            bible.getChapter();
          })
        })
      }

      function showChapterModal() {
        var $title = $chapterModal.find('.modal-title')
          , $body = $chapterModal.find('.modal-body')
          , book = bible.getCurrent().book
          , chapters = bible.getCurrent().book.chapters;
        $body.html('');
        $title.html(bible.getCurrent().book.name);
        for (var i = 1; i <= chapters; i++) {
          $body.append('<span> <a href="#" data-book="' + book.abbrev + '" data-chapter="' + i + '">' + i + '</a></span>');
        }
        $body.find('a').on('click', function (evt) {
          evt.preventDefault();
          $chapterModal.modal('hide');
          var book = $(this).data('book')
            , chapter = $(this).data('chapter');
          bible.setCurrent(book, chapter);
          bible.getChapter();
        })
      }

      function showBibleModal() {
        var $title = $bibleModal.find('.modal-title')
          , $body = $bibleModal.find('.modal-body')
          , bibles = bible.getBibles();
        $title.html('Biblia fordítások');
        $body.html('');
        bibles.forEach(function (bible) {
          $body.append('<p><a href="#" data-bible="' + bible.abbrev + '">' + bible.name + '</a></span>');
        });
        $bibleModal.find('a').on('click', function (evt) {
          evt.preventDefault();
          $bibleModal.modal('hide');
          bible.setCurrent(null, null, $(this).data('bible'));
          if ($books.hasClass('hidden')) {
            bible.getChapter();
          }
        })
      }

      function showSearchResults() {}
      return {
        init: init
        , renderTitlePage: renderTitlePage
        , renderReader: renderReader
        , renderSearchResults: renderSearchResults
        , renderControlButtons: renderControlButtons
      }
    })();
    bible.init();
    view.init();
  })(jQuery);
});