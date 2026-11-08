/* Japanese Reading Aide — interactive vocabulary example. */
'use strict';

// React component: creates the small vocabulary card in the reading preview.
function WordPreview() {
    // State remembers whether the English meaning is currently visible.
    // true = visible, false = hidden. Changing state redraws the component.
    const [showMeaning, setShowMeaning] = React.useState(true);

    // React.createElement(tag, properties, children) builds HTML-like elements.
    return React.createElement(
        'div',
        { className: 'word-card' }, // CSS class used to style the card.
        React.createElement('strong', null, '図書館'), // Japanese word.
        React.createElement('p', null, 'としょかん'), // Pronunciation.

        // Only display the meaning when showMeaning is true.
        showMeaning && React.createElement('p', null, 'Meaning: Library'),

        React.createElement(
            'button',
            {
                type: 'button',
                // Clicking switches between showing and hiding the meaning.
                onClick: function () {
                    setShowMeaning(!showMeaning);
                }
            },
            // Change the button label based on the current state.
            showMeaning ? 'Hide meaning' : 'Show meaning'
        )
    );
}

// Find <div id="word-preview"> in index.html and display the React card there.
ReactDOM.createRoot(document.getElementById('word-preview')).render(
    React.createElement(WordPreview)
);
