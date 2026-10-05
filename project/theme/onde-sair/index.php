<?php
/**
 * Fallback · index.php (sempre necessário)
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header(); ?>

<div class="shell">
    <section class="section">
        <?php if ( have_posts() ) : ?>
            <div class="places-grid">
                <?php while ( have_posts() ) : the_post(); ?>
                    <a class="card place interactive" href="<?php the_permalink(); ?>">
                        <?php ondesair_thumb( 'os-card', '' ); ?>
                        <div class="body">
                            <h4><?php the_title(); ?></h4>
                            <p class="sub"><?php echo wp_kses_post( get_the_excerpt() ); ?></p>
                        </div>
                    </a>
                <?php endwhile; ?>
            </div>
            <div class="row" style="justify-content:center;margin-top:32px;">
                <?php the_posts_pagination(); ?>
            </div>
        <?php else : ?>
            <p class="mute" style="text-align:center;padding:48px 0;">Ainda não tem nada por aqui.</p>
        <?php endif; ?>
    </section>
</div>

<?php get_footer();
