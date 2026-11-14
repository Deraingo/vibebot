function FinalsRouletteSection(){
    return(
    <>
    <div className="app-section">
        <h2 className="app-title">Finals Roulette</h2>
        <p>To add you your twitch press the <i>add bot to your twitch</i>button</p>
        <p>Then add a new channel point redeem called "Random Loadout"</p>
        <i>I will be changing this to hopefully ADD the redeem too but that is a WiP</i>
        <div id="finals-roulette-section" className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
        
                <a className="link-card p-6 rounded-lg shadow-md" href="https://discord.com/oauth2/authorize?client_id=1426751245200265366&permissions=171799021632&scope=bot%20applications.commands">
                        Add To Your Discord
                </a>

                <a
                    href="/auth/twitch/login"
                    className="link-card p-6 rounded-lg shadow-md"
                    >
                    <svg className="w-5 h-5 mr-2" /* twitch icon */ />
                    Add bot to your Twitch
                </a>
        </div>
    </div>
    </>
    );
}

export default FinalsRouletteSection
