import 'package:flame/components.dart';
import 'package:flame/effects.dart';
import 'package:flame/events.dart';
import 'package:flame/game.dart' hide Game; // Hides the Game class to avoid naming conflicts.
import 'package:flame/rendering.dart';
import 'package:flame/text.dart';
import 'package:fruit_cutting_game/core/configs/constants/app_router.dart';
import 'package:fruit_cutting_game/core/configs/theme/app_colors.dart';
import 'package:fruit_cutting_game/main_router_game.dart';

/// This class represents the route for the pause screen in the game.
class VictoryRoute extends Route {
  /// Constructor for VictoryRoute, sets it to show GameVictoryPage.
  VictoryRoute() : super(GameVictoryPage.new, transparent: true);

  /// When this route is pushed (opened), stop the game time and apply a gray effect to the background.
  @override
  void onPush(Route? previousRoute) {
    previousRoute!
      ..stopTime() // Stops the game's time.
      ..addRenderEffect(
        // Adds a visual effect to the background.
        PaintDecorator.grayscale(opacity: 0.5) // Makes the background gray.
          ..addBlur(3.0), // Adds a blur effect to the background.
      );
  }

  /// When this route is popped (closed), resume game time and remove effects.
  @override
  void onPop(Route nextRoute) {
    nextRoute
      ..resumeTime() // Resumes the game's time.
      ..removeRenderEffect(); // Removes the visual effects from the background.
  }
}

/// This class represents the pause page displayed when the game is paused.
class GameVictoryPage extends Component with TapCallbacks, HasGameReference<MainRouterGame> {
  late TextComponent _textComponent; // Text component to show the "VICTORY" message.

  /// Load the components for the pause page.
  @override
  Future<void> onLoad() async {
    print("pause load"); // Log message to indicate the pause page is loading.
    final game = findGame()!; // Find the current game instance.

    final textTitlePaint = TextPaint(
      style: const TextStyle(
        fontSize: 70,
        color: AppColors.white,
        fontFamily: 'Marshmallow',
        letterSpacing: 3.0,
      ),
    );
    // Add the text component to display "VICTORY".
    addAll([
      _textComponent = TextComponent(
        text: 'VICTORY', // The message to display when the game is paused.
        position: game.canvasSize / 2, // Center the text on the canvas.
        anchor: Anchor.center, // Set the anchor point to the center of the text.
        children: [
          // Add a scaling effect to the text to make it pulsate.
          ScaleEffect.to(
            Vector2.all(1.1), // Scale the text up to 110%.
            EffectController(
              duration: 0.3, // Duration of the scaling effect.
              alternate: true, // Make the effect go back and forth.
              infinite: true, // Repeat the effect forever.
            ),
          ),
        ],
        textRenderer: textTitlePaint,
      ),
    ]);
  }

  /// Called when the game is resized; updates text position to stay centered.
  @override
  void onGameResize(Vector2 size) {
    super.onGameResize(size); // Call the superclass method to handle resizing.
    _textComponent.position = Vector2(game.size.x / 2, game.size.y / 2 - 20); // Recenter the text component.
  }

  /// Always returns true, indicating that this component can contain tap events.
  @override
  bool containsLocalPoint(Vector2 point) {
    return true; // Accept all tap events.
  }

  /// Handle tap up events; navigate back to the previous screen when tapped.
  @override
  void onTapUp(TapUpEvent event) {
    game.router.pushNamed(AppRouter.gameSave); // Go back to the previous route (unpause the game).
  }
}
